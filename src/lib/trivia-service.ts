import { getDatabase, ensureSchema, seedQuestionsForEvent } from "./db";
import {
  TriviaEvent,
  TriviaSettings,
  Player,
  QuestionClient,
  QuestionAdmin,
  SubmitAnswerPayload,
  SubmitAnswerResponse,
  LeaderboardEntry,
  PlayerAnswerRecord,
} from "@/types/trivia";
import crypto from "crypto";

// ==========================================
// 1. EVENT MANAGEMENT (SUPERADMIN)
// ==========================================

export async function getActiveEvent(): Promise<TriviaEvent | null> {
  await ensureSchema();
  const client = getDatabase();

  const res = await client.execute("SELECT * FROM events WHERE status = 'active' LIMIT 1");
  const row = res.rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    birthdayPerson: String(row.birthday_person),
    timerSeconds: Number(row.timer_seconds || 10),
    status: row.status as "active" | "inactive" | "finished",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getAllEvents(): Promise<TriviaEvent[]> {
  await ensureSchema();
  const client = getDatabase();

  const res = await client.execute(`
    SELECT 
      e.*,
      (SELECT COUNT(*) FROM players WHERE event_id = e.id) as players_count,
      (SELECT COUNT(*) FROM questions WHERE event_id = e.id) as questions_count
    FROM events e
    ORDER BY e.created_at DESC
  `);

  return res.rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    birthdayPerson: String(row.birthday_person),
    timerSeconds: Number(row.timer_seconds || 10),
    status: row.status as "active" | "inactive" | "finished",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    playersCount: Number(row.players_count || 0),
    questionsCount: Number(row.questions_count || 0),
  }));
}

export async function getEventById(idOrSlug: string): Promise<TriviaEvent | null> {
  await ensureSchema();
  const client = getDatabase();

  const res = await client.execute({
    sql: "SELECT * FROM events WHERE id = ? OR slug = ?",
    args: [idOrSlug, idOrSlug],
  });
  const row = res.rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    birthdayPerson: String(row.birthday_person),
    timerSeconds: Number(row.timer_seconds || 10),
    status: row.status as "active" | "inactive" | "finished",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createEvent(data: {
  title: string;
  birthdayPerson: string;
  timerSeconds?: number;
  activateNow?: boolean;
  status?: "active" | "inactive";
}): Promise<TriviaEvent> {
  await ensureSchema();
  const client = getDatabase();

  const title = data.title.trim();
  const birthdayPerson = data.birthdayPerson.trim();
  const timerSeconds = data.timerSeconds || 15;
  const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slug = `${birthdayPerson.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const isActivate = Boolean(data.activateNow || data.status === "active");
  const status = isActivate ? "active" : "inactive";

  if (isActivate) {
    // Deactivate all others first
    await client.execute("UPDATE events SET status = 'inactive'");
  }

  await client.execute({
    sql: `INSERT INTO events (id, slug, title, birthday_person, timer_seconds, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, slug, title, birthdayPerson, timerSeconds, status, now, now],
  });

  // Seed default 10 customizable questions for this new event
  await seedQuestionsForEvent(client, id);

  return {
    id,
    slug,
    title,
    birthdayPerson,
    timerSeconds,
    status: status as "active" | "inactive",
    createdAt: now,
    updatedAt: now,
  };
}

export async function setActiveEvent(eventId: string | null): Promise<void> {
  await ensureSchema();
  const client = getDatabase();

  // First deactivate all
  await client.execute("UPDATE events SET status = 'inactive'");

  if (eventId && eventId !== "none") {
    await client.execute({
      sql: "UPDATE events SET status = 'active', updated_at = ? WHERE id = ?",
      args: [new Date().toISOString(), eventId],
    });
  }
}

export async function updateEvent(
  id: string,
  data: Partial<Pick<TriviaEvent, "title" | "birthdayPerson" | "timerSeconds" | "status">>
): Promise<void> {
  await ensureSchema();
  const client = getDatabase();
  const now = new Date().toISOString();

  if (data.status === "active") {
    await client.execute("UPDATE events SET status = 'inactive'");
  }

  const existing = await getEventById(id);
  if (!existing) throw new Error("Evento no encontrado");

  const newTitle = data.title !== undefined ? data.title.trim() : existing.title;
  const newBirthday = data.birthdayPerson !== undefined ? data.birthdayPerson.trim() : existing.birthdayPerson;
  const newTimer = data.timerSeconds !== undefined ? data.timerSeconds : existing.timerSeconds;
  const newStatus = data.status !== undefined ? data.status : existing.status;

  await client.execute({
    sql: `UPDATE events 
          SET title = ?, birthday_person = ?, timer_seconds = ?, status = ?, updated_at = ?
          WHERE id = ?`,
    args: [newTitle, newBirthday, newTimer, newStatus, now, id],
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await ensureSchema();
  const client = getDatabase();

  // Cascade delete
  await client.execute({
    sql: "DELETE FROM player_answers WHERE player_id IN (SELECT id FROM players WHERE event_id = ?)",
    args: [id],
  });
  await client.execute({
    sql: "DELETE FROM questions WHERE event_id = ?",
    args: [id],
  });
  await client.execute({
    sql: "DELETE FROM players WHERE event_id = ?",
    args: [id],
  });
  await client.execute({
    sql: "DELETE FROM events WHERE id = ?",
    args: [id],
  });
}

// ==========================================
// 2. PLAYERS & GAMEPLAY (SCOPED TO EVENT)
// ==========================================

export async function registerPlayer(
  firstName: string,
  lastName: string,
  avatar = "🥳",
  eventId?: string
): Promise<Player> {
  await ensureSchema();
  const client = getDatabase();

  let targetEventId = eventId;
  if (!targetEventId) {
    const active = await getActiveEvent();
    if (!active) {
      throw new Error("No hay ningún evento activo en este momento");
    }
    targetEventId = active.id;
  }

  const cleanFirst = firstName.trim();
  const cleanLast = lastName.trim();

  if (!cleanFirst) throw new Error("El nombre es obligatorio");
  if (!cleanLast) throw new Error("El apellido es obligatorio");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO players (id, event_id, first_name, last_name, avatar, score, total_time_ms, is_finished, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
    args: [id, targetEventId, cleanFirst, cleanLast, avatar, now, now],
  });

  return {
    id,
    eventId: targetEventId,
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
    eventId: String(row.event_id || "default-event"),
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

export async function getClientQuestions(eventId?: string): Promise<QuestionClient[]> {
  await ensureSchema();
  const client = getDatabase();

  let targetEventId = eventId;
  if (!targetEventId) {
    const active = await getActiveEvent();
    if (!active) return [];
    targetEventId = active.id;
  }

  const res = await client.execute({
    sql: "SELECT id, event_id, order_num, question, options FROM questions WHERE event_id = ? ORDER BY order_num ASC",
    args: [targetEventId],
  });

  return res.rows.map((r) => ({
    id: Number(r.id),
    eventId: String(r.event_id),
    orderNum: Number(r.order_num),
    question: String(r.question),
    options: JSON.parse(String(r.options)),
  }));
}

export async function getAllQuestionsAdmin(eventId?: string): Promise<QuestionAdmin[]> {
  await ensureSchema();
  const client = getDatabase();

  let targetEventId = eventId;
  if (!targetEventId) {
    const active = await getActiveEvent();
    if (!active) return [];
    targetEventId = active.id;
  }

  const res = await client.execute({
    sql: "SELECT * FROM questions WHERE event_id = ? ORDER BY order_num ASC",
    args: [targetEventId],
  });

  return res.rows.map((r) => ({
    id: Number(r.id),
    eventId: String(r.event_id),
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
    eventId: String(row.event_id),
    orderNum: Number(row.order_num),
    question: String(row.question),
    options: JSON.parse(String(row.options)),
    correctIndex: Number(row.correct_index),
    explanation: String(row.explanation),
  };
}

export async function resetQuestionsToDefault(eventId?: string): Promise<QuestionAdmin[]> {
  await ensureSchema();
  const client = getDatabase();

  let targetEventId = eventId;
  if (!targetEventId) {
    const active = await getActiveEvent();
    if (!active) return [];
    targetEventId = active.id;
  }

  await client.execute({
    sql: "DELETE FROM questions WHERE event_id = ?",
    args: [targetEventId],
  });
  await seedQuestionsForEvent(client, targetEventId);
  return getAllQuestionsAdmin(targetEventId);
}

export async function submitAnswer(payload: SubmitAnswerPayload): Promise<SubmitAnswerResponse> {
  await ensureSchema();
  const client = getDatabase();

  const { playerId, questionId, selectedIndex } = payload;
  const timeSpentMs = Math.max(0, Math.min(15000, Math.round(payload.timeSpentMs || 15000)));

  const playerRes = await client.execute({
    sql: "SELECT * FROM players WHERE id = ?",
    args: [playerId],
  });
  const playerRow = playerRes.rows[0];
  if (!playerRow) {
    throw new Error("Jugador no encontrado");
  }
  const eventId = String(playerRow.event_id || "default-event");

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

  // Strict check: single answer per question per player
  const existingAnswer = await client.execute({
    sql: "SELECT id FROM player_answers WHERE player_id = ? AND question_id = ?",
    args: [playerId, questionId],
  });
  if (existingAnswer.rows.length > 0) {
    throw new Error("Esta pregunta ya fue respondida y no puede volver a contestarse.");
  }

  await client.execute({
    sql: `
      INSERT INTO player_answers (player_id, question_id, selected_index, is_correct, time_spent_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [playerId, questionId, selectedIndex, isCorrect ? 1 : 0, timeSpentMs, now],
  });

  // Calculate actual totals for this player
  const totalQuestionsRes = await client.execute({
    sql: "SELECT COUNT(*) as c FROM questions WHERE event_id = ?",
    args: [eventId],
  });
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

export async function getLeaderboard(eventId?: string): Promise<LeaderboardEntry[]> {
  await ensureSchema();
  const client = getDatabase();

  let targetEventId = eventId;
  if (!targetEventId) {
    const active = await getActiveEvent();
    if (!active) return [];
    targetEventId = active.id;
  }

  // Tie breaker: Mayor score DESC, Menor total_time_ms ASC, Primer registro created_at ASC
  const res = await client.execute({
    sql: `
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
      WHERE p.event_id = ?
      GROUP BY p.id
      ORDER BY p.score DESC, p.total_time_ms ASC, p.created_at ASC
    `,
    args: [targetEventId],
  });

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

export async function resetGame(eventId?: string): Promise<void> {
  await ensureSchema();
  const client = getDatabase();

  let targetEventId = eventId;
  if (!targetEventId) {
    const active = await getActiveEvent();
    if (!active) return;
    targetEventId = active.id;
  }

  await client.execute({
    sql: "DELETE FROM player_answers WHERE player_id IN (SELECT id FROM players WHERE event_id = ?)",
    args: [targetEventId],
  });
  await client.execute({
    sql: "DELETE FROM players WHERE event_id = ?",
    args: [targetEventId],
  });
}

export async function getSettings(eventId?: string): Promise<TriviaSettings> {
  await ensureSchema();
  const event = eventId ? await getEventById(eventId) : await getActiveEvent();
  if (!event) {
    return {
      birthdayPerson: "el Cumpleañero",
      eventTitle: "🎉 Trivia de Cumpleaños",
      questionTimerSeconds: 15,
    };
  }
  return {
    birthdayPerson: event.birthdayPerson,
    eventTitle: event.title,
    questionTimerSeconds: event.timerSeconds,
  };
}
