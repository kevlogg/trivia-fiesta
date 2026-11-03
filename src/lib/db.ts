import { createClient, Client } from "@libsql/client";
import path from "path";
import fs from "fs";
import os from "os";

declare global {
  // eslint-disable-next-line no-var
  var __libsqlClient: Client | undefined;
  // eslint-disable-next-line no-var
  var __schemaInitialized: boolean | undefined;
}

export function getDatabase(): Client {
  if (global.__libsqlClient) {
    return global.__libsqlClient;
  }

  let url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  if (process.env.VERCEL && (!url || url.startsWith("file:"))) {
    const dbPath = path.join(os.tmpdir(), "trivia.db");
    url = `file:${dbPath}`;
  } else if (!url || url.startsWith("file:")) {
    const dbDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true });
      } catch {
        // ignore if not writable
      }
    }
    const dbPath = path.join(dbDir, "trivia.db");
    url = `file:${dbPath}`;
  }

  const client = createClient({
    url,
    authToken,
  });

  global.__libsqlClient = client;
  return client;
}

export async function ensureSchema(): Promise<void> {
  if (global.__schemaInitialized) {
    return;
  }

  const client = getDatabase();

  // 1. Events Table (Multi-Event Architecture)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      birthday_person TEXT NOT NULL,
      timer_seconds INTEGER NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'inactive',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Settings table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 3. Players table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      event_id TEXT DEFAULT 'default-event',
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT '🥳',
      score INTEGER NOT NULL DEFAULT 0,
      total_time_ms INTEGER NOT NULL DEFAULT 0,
      is_finished INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 4. Questions table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT DEFAULT 'default-event',
      order_num INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT NOT NULL
    );
  `);

  // 5. Player Answers table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS player_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_index INTEGER,
      is_correct INTEGER NOT NULL,
      time_spent_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(player_id, question_id)
    );
  `);

  // Column migrations in case tables existed without event_id
  try {
    await client.execute("ALTER TABLE questions ADD COLUMN event_id TEXT DEFAULT 'default-event'");
  } catch {
    // already exists
  }
  try {
    await client.execute("ALTER TABLE players ADD COLUMN event_id TEXT DEFAULT 'default-event'");
  } catch {
    // already exists
  }

  // Safe migration: Remove obsolete global UNIQUE constraint on order_num so each event can have its own questions 1..10
  try {
    const tableInfo = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='questions'");
    const sqlStr = String(tableInfo.rows[0]?.sql || "");
    if (sqlStr.includes("order_num INTEGER NOT NULL UNIQUE")) {
      await client.execute(`
        CREATE TABLE questions_v2 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id TEXT DEFAULT 'default-event',
          order_num INTEGER NOT NULL,
          question TEXT NOT NULL,
          options TEXT NOT NULL,
          correct_index INTEGER NOT NULL,
          explanation TEXT NOT NULL
        );
      `);
      await client.execute(`
        INSERT INTO questions_v2 (id, event_id, order_num, question, options, correct_index, explanation)
        SELECT id, COALESCE(event_id, 'default-event'), order_num, question, options, correct_index, explanation
        FROM questions;
      `);
      await client.execute("DROP TABLE questions;");
      await client.execute("ALTER TABLE questions_v2 RENAME TO questions;");
    }
  } catch {
    // Already migrated
  }

  // Ensure at least one default event exists
  const eventsCountRes = await client.execute("SELECT COUNT(*) as c FROM events");
  const eventsCount = Number(eventsCountRes.rows[0]?.c || 0);

  if (eventsCount === 0) {
    const now = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO events (id, slug, title, birthday_person, timer_seconds, status, created_at, updated_at)
            VALUES ('default-event', 'cumple-principal', '🎉 Trivia de Cumpleaños', 'el Cumpleañero', 10, 'active', ?, ?)`,
      args: [now, now],
    });
  }

  // Check if questions exist for default-event
  const qRes = await client.execute("SELECT COUNT(*) as c FROM questions WHERE event_id = 'default-event' OR event_id IS NULL");
  const qCount = Number(qRes.rows[0]?.c || 0);

  if (qCount === 0) {
    await seedQuestionsForEvent(client, "default-event");
  } else {
    // Update any legacy questions with null event_id
    await client.execute("UPDATE questions SET event_id = 'default-event' WHERE event_id IS NULL");
  }

  global.__schemaInitialized = true;
}

export async function seedQuestionsForEvent(client: Client, eventId: string) {
  const defaultQuestions = [
    {
      order_num: 1,
      question: "¿Cuál es su comida favorita indiscutida que comería todos los días?",
      options: JSON.stringify([
        "Milanesas con papas fritas",
        "Asado con amigos y ensalada rusa",
        "Pizza casera a la piedra",
        "Sushi o comida asiática"
      ]),
      correct_index: 0,
      explanation: "¡Las milanesas bien crocantes con papas no se negocian jamás!",
    },
    {
      order_num: 2,
      question: "¿Qué fobia o miedo secreto confiesa cuando entra en confianza?",
      options: JSON.stringify([
        "A las cucarachas voladoras",
        "A quedarse sin batería en el celular",
        "A las montañas rusas y alturas",
        "A los payasos de fiesta"
      ]),
      correct_index: 0,
      explanation: "¡Aparece una cucaracha volando y corre más rápido que Usain Bolt!",
    },
    {
      order_num: 3,
      question: "¿Cuál es su bebida o trago predilecto para arrancar la fiesta?",
      options: JSON.stringify([
        "Fernet con Coca bien espumoso",
        "Cerveza rubia bien helada",
        "Gin Tonic con pepino o frutos rojos",
        "Vino tinto Malbec en copa"
      ]),
      correct_index: 0,
      explanation: "¡El 70/30 con hielo hasta el tope es su marca registrada!",
    },
    {
      order_num: 4,
      question: "¿Qué suele hacer siempre cuando suena su tema favorito en la pista?",
      options: JSON.stringify([
        "Canta a los gritos abrazando a quien tenga al lado",
        "Va al medio a tirar sus mejores pasos prohibidos",
        "Saca el celular para filmar stories de recuerdo",
        "Va volando a la barra a pedir otro trago"
      ]),
      correct_index: 0,
      explanation: "¡Se transforma en cantante de recital y deja la garganta en el tema!",
    },
    {
      order_num: 5,
      question: "¿Cuál es su mayor talento oculto que pocos conocen?",
      options: JSON.stringify([
        "Imitar voces, parientes y personajes",
        "Cocinar el mejor chimichurri o salsa casera",
        "Recordar anécdotas de hace 15 años al detalle",
        "Armar playlists temáticas perfectas"
      ]),
      correct_index: 0,
      explanation: "¡Las imitaciones en reuniones familiares son de nivel profesional!",
    },
    {
      order_num: 6,
      question: "¿A qué serie o maratón le dedicó un fin de semana entero sin culpa?",
      options: JSON.stringify([
        "The Office",
        "Breaking Bad",
        "Game of Thrones",
        "Friends"
      ]),
      correct_index: 0,
      explanation: "¡Se sabe los diálogos y las miradas a cámara de Michael Scott de memoria!",
    },
    {
      order_num: 7,
      question: "¿Qué objeto no le puede faltar jamás al salir de su casa?",
      options: JSON.stringify([
        "Celular con al menos 80% de batería",
        "Perfume y chicles de menta",
        "Auriculares inalámbricos",
        "Las llaves chequeadas 3 veces"
      ]),
      correct_index: 0,
      explanation: "¡Quedarse sin batería es su pesadilla moderna número uno!",
    },
    {
      order_num: 8,
      question: "¿Cuál es su destino soñado para un viaje épico con amigos?",
      options: JSON.stringify([
        "Playas paradisíacas de Brasil con sol y caipirinhas",
        "Recorrer ciudades históricas de Europa en tren",
        "Cabaña con nieve y fogón en la Patagonia",
        "Mochilazo de aventura por el Sudeste Asiático"
      ]),
      correct_index: 0,
      explanation: "¡Playa, calor, amigos y buena música es su combinación perfecta!",
    },
    {
      order_num: 9,
      question: "¿Cuál es la típica frase que dice siempre al planear una salida?",
      options: JSON.stringify([
        "'Salimos tranqui, una copa y volvemos temprano'",
        "'¿A qué hora hay que estar? Yo paso a buscar'",
        "'Esta noche no tomo nada, manejo yo'",
        "'Organicemos algo bien producido'"
      ]),
      correct_index: 0,
      explanation: "¡El famoso 'salimos tranqui' que mágicamente termina viendo el amanecer!",
    },
    {
      order_num: 10,
      question: "¿Qué anécdota vergonzosa le recuerdan todos los años los amigos?",
      options: JSON.stringify([
        "Envió un audio comprometedor al grupo equivocado",
        "Se confundió de auto y quiso abrir la puerta de un desconocido",
        "Se quedó dormido con los zapatos puestos en una fiesta",
        "Se tropezó de manera épica entrando a una fiesta"
      ]),
      correct_index: 0,
      explanation: "¡Ese audio todavía vive en la memoria y los stickers de WhatsApp del grupo!",
    },
  ];

  for (const q of defaultQuestions) {
    await client.execute({
      sql: `INSERT INTO questions (event_id, order_num, question, options, correct_index, explanation)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [eventId, q.order_num, q.question, q.options, q.correct_index, q.explanation],
    });
  }
}

// Backward compatibility alias
export async function seedQuestions(client: Client) {
  return seedQuestionsForEvent(client, "default-event");
}

export const db = getDatabase();
