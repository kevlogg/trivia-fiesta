import { getDatabase, ensureSchema, seedQuestions } from "./db";
import {
  Player,
  QuestionClient,
  QuestionAdmin,
  SubmitAnswerPayload,
  SubmitAnswerResponse,
  LeaderboardEntry,
  PlayerAnswerRecord,
  TriviaSettings,
} from "@/types/trivia";
import crypto from "crypto";

export async function registerPlayer(firstName: string, lastName: string, avatar = "🥳"): Promise<Player> {
  await ensureSchema();
  const client = getDatabase();

  const cleanFirst = firstName.trim();
  const cleanLast = lastName.trim();

  if (!cleanFirst) {
    throw new Error("El nombre es obligatorio");
  }
  if (!cleanLast) {
    throw new Error("El apellido es obligatorio");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO players (id, first_name, last_name, avatar, score, total_time_ms, is_finished, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?)`,
    args: [id, cleanFirst, cleanLast, avatar, now, now],
  });

  return {
    id,
    firstName: cleanFirst,
    lastName: cleanLast,
    avatar,
    score: 0,
    totalTimeMs: 0,
    isFinished: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getPlayer(id: string): Promise<Player | null> {
  await ensureSchema();
  const client = getDatabase();

  const res = await client.execute({
    sql: "SELECT * FROM players WHERE id = ?",
    args: [id],
  });

  const row = res.rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    avatar: String(row.avatar || "🥳"),
    score: Number(row.score),
    totalTimeMs: Number(row.total_time_ms),
    isFinished: Number(row.is_finished) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getClientQuestions(): Promise<QuestionClient[]> {
  await ensureSchema();
  const client = getDatabase();

  const res = await client.execute("SELECT id, order_num, question, options FROM questions ORDER BY order_num ASC");

  return res.rows.map((r) => ({
    id: Number(r.id),
    orderNum: Number(r.order_num),
    question: String(r.question),
    options: JSON.parse(String(r.options)),
  }));
}

export async function getAllQuestionsAdmin(): Promise<QuestionAdmin[]> {
  await ensureSchema();
  const client = getDatabase();

  const res = await client.execute("SELECT * FROM questions ORDER BY order_num ASC");

  return res.rows.map((r) => ({
    id: Number(r.id),
    orderNum: Number(r.order_num),
    question: String(r.question),
    options: JSON.parse(String(r.options)),
    correctIndex: Number(r.correct_index),
    explanation: String(r.explanation),
  }));
}

export async function updateQuestion(
  id: number,
  data: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }
): Promise<QuestionAdmin> {
  await ensureSchema();
  const client = getDatabase();

  const cleanQ = data.question.trim();
  if (!cleanQ) {
    throw new Error("La pregunta no puede estar vacía");
  }
  if (!Array.isArray(data.options) || data.options.length < 2) {
    throw new Error("Debe haber al menos 2 opciones de respuesta");
  }
  const cleanOptions = data.options.map((o) => o.trim());
  if (cleanOptions.some((o) => !o)) {
    throw new Error("Todas las opciones deben tener texto");
  }
  const correctIdx = Math.max(0, Math.min(cleanOptions.length - 1, Number(data.correctIndex) || 0));

  await client.execute({
    sql: `UPDATE questions
          SET question = ?, options = ?, correct_index = ?, explanation = ?
          WHERE id = ?`,
    args: [cleanQ, JSON.stringify(cleanOptions), correctIdx, (data.explanation || "").trim(), id],
  });

  const res = await client.execute({
    sql: "SELECT * FROM questions WHERE id = ?",
    args: [id],
  });
  const row = res.rows[0];
  if (!row) throw new Error("Pregunta no encontrada");

  return {
    id: Number(row.id),
    orderNum: Number(row.order_num),
    question: String(row.question),
    options: JSON.parse(String(row.options)),
    correctIndex: Number(row.correct_index),
    explanation: String(row.explanation),
  };
}

export async function resetQuestionsToDefault(): Promise<QuestionAdmin[]> {
  await ensureSchema();
  const client = getDatabase();

  await client.execute("DELETE FROM questions");
  await seedQuestions(client);
  return getAllQuestionsAdmin();
}

export async function submitAnswer(payload: SubmitAnswerPayload): Promise<SubmitAnswerResponse> {
  await ensureSchema();
  const client = getDatabase();

  const { playerId, questionId, selectedIndex } = payload;
  const timeSpentMs = Math.max(0, Math.min(10000, Math.round(payload.timeSpentMs || 10000)));

  const playerRes = await client.execute({
    sql: "SELECT * FROM players WHERE id = ?",
    args: [playerId],
  });
  if (playerRes.rows.length === 0) {
    throw new Error("Jugador no encontrado");
  }

  const qRes = await client.execute({
    sql: "SELECT * FROM questions WHERE id = ?",
    args: [questionId],
  });
  const question = qRes.rows[0];
  if (!question) {
    throw new Error("Pregunta no encontrada");
  }

  const correctIndex = Number(question.correct_index);
  const isCorrect = selectedIndex !== null && selectedIndex === correctIndex;
  const now = new Date().toISOString();

  // Upsert answer
  await client.execute({
    sql: `
      INSERT INTO player_answers (player_id, question_id, selected_index, is_correct, time_spent_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(player_id, question_id) DO UPDATE SET
        selected_index = excluded.selected_index,
        is_correct = excluded.is_correct,
        time_spent_ms = excluded.time_spent_ms
    `,
    args: [playerId, questionId, selectedIndex, isCorrect ? 1 : 0, timeSpentMs, now],
  });

  // Calculate actual totals
  const totalQuestionsRes = await client.execute("SELECT COUNT(*) as c FROM questions");
  const totalQuestions = Number(totalQuestionsRes.rows[0]?.c || 10);

  const statsRes = await client.execute({
    sql: `
      SELECT 
        COUNT(*) as total_answered,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        SUM(time_spent_ms) as total_time
      FROM player_answers
      WHERE player_id = ?
    `,
    args: [playerId],
  });

  const statsRow = statsRes.rows[0];
  const totalAnswered = Number(statsRow?.total_answered || 0);
  const newScore = Number(statsRow?.correct_count || 0);
  const newTotalTime = Number(statsRow?.total_time || 0);
  const isFinished = totalAnswered >= totalQuestions;

  await client.execute({
    sql: `
      UPDATE players
      SET score = ?, total_time_ms = ?, is_finished = ?, updated_at = ?
      WHERE id = ?
    `,
    args: [newScore, newTotalTime, isFinished ? 1 : 0, now, playerId],
  });

  return {
    isCorrect,
    correctIndex,
    explanation: String(question.explanation),
    currentScore: newScore,
    totalTimeMs: newTotalTime,
    isFinished,
    questionIndex: totalAnswered,
    totalQuestions,
  };
}

export async function getPlayerAnswers(playerId: string): Promise<PlayerAnswerRecord[]> {
  await ensureSchema();
  const client = getDatabase();

  const res = await client.execute({
    sql: `
      SELECT 
        a.id, a.player_id, a.question_id, q.question, q.options,
        a.selected_index, q.correct_index, a.is_correct, a.time_spent_ms, a.created_at
      FROM player_answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.player_id = ?
      ORDER BY q.order_num ASC
    `,
    args: [playerId],
  });

  return res.rows.map((r) => ({
    id: Number(r.id),
    playerId: String(r.player_id),
    questionId: Number(r.question_id),
    questionText: String(r.question),
    options: JSON.parse(String(r.options)),
    selectedIndex: r.selected_index !== null ? Number(r.selected_index) : null,
    correctIndex: Number(r.correct_index),
    isCorrect: Number(r.is_correct) === 1,
    timeSpentMs: Number(r.time_spent_ms),
    createdAt: String(r.created_at),
  }));
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  await ensureSchema();
  const client = getDatabase();

  const res = await client.execute(`
    SELECT 
      p.id,
      p.first_name,
      p.last_name,
      p.avatar,
      p.score,
      p.total_time_ms,
      p.is_finished,
      p.created_at,
      COUNT(a.id) as answers_count
    FROM players p
    LEFT JOIN player_answers a ON p.id = a.player_id
    GROUP BY p.id
    ORDER BY p.score DESC, p.total_time_ms ASC, p.created_at ASC
  `);

  return res.rows.map((row, index) => ({
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    avatar: String(row.avatar || "🥳"),
    score: Number(row.score),
    totalTimeMs: Number(row.total_time_ms),
    isFinished: Number(row.is_finished) === 1,
    rank: index + 1,
    answersCount: Number(row.answers_count),
  }));
}

export async function getSettings(): Promise<TriviaSettings> {
  await ensureSchema();
  const client = getDatabase();

  const res = await client.execute("SELECT key, value FROM settings");
  const map: Record<string, string> = {};
  for (const r of res.rows) {
    map[String(r.key)] = String(r.value);
  }

  return {
    birthdayPerson: map["birthday_person"] || "el Cumpleañero",
    eventTitle: map["event_title"] || "🎉 Trivia de Cumpleaños",
    questionTimerSeconds: parseInt(map["question_timer_seconds"] || "10", 10),
  };
}

export async function updateSettings(settings: Partial<TriviaSettings>): Promise<void> {
  await ensureSchema();
  const client = getDatabase();

  if (settings.birthdayPerson !== undefined) {
    await client.execute({
      sql: `INSERT INTO settings (key, value) VALUES ('birthday_person', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [settings.birthdayPerson.trim()],
    });
  }
  if (settings.eventTitle !== undefined) {
    await client.execute({
      sql: `INSERT INTO settings (key, value) VALUES ('event_title', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [settings.eventTitle.trim()],
    });
  }
  if (settings.questionTimerSeconds !== undefined) {
    await client.execute({
      sql: `INSERT INTO settings (key, value) VALUES ('question_timer_seconds', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [String(settings.questionTimerSeconds)],
    });
  }
}

export async function resetGame(): Promise<void> {
  await ensureSchema();
  const client = getDatabase();

  await client.execute("DELETE FROM player_answers");
  await client.execute("DELETE FROM players");
}
