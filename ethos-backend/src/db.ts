import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Flag indicating whether the application should use PostgreSQL.
 * Initially set based on the presence of a `DATABASE_URL`, but if a connection
 * cannot be established (e.g. during tests where no DB is available) the flag
 * is flipped off and the app gracefully falls back to the JSON store.
 */
let usePg =
  !!process.env.DATABASE_URL &&
  (process.env.NODE_ENV !== 'test' || process.env.USE_PG === 'true');

let pool: Pool = usePg
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : ({} as Pool);

/**
 * Disable PostgreSQL usage and fall back to the JSON store.
 * This helper is useful if a database error occurs after startup.
 */
function disablePg(): void {
  usePg = false;
  pool = {} as Pool;
}

/**
 * Provide a custom pool for tests. This forces Postgres mode and replaces the
 * global pool instance so tests can run against an in-memory database.
 */
export function setTestPool(testPool: Pool): void {
  pool = testPool;
  usePg = true;
}

/**
 * Ensure required tables and starter data exist when using PostgreSQL.
 * This allows fresh deployments to work without running separate migrations.
 */
async function initializeDatabase(): Promise<void> {
  if (!usePg) return;
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL', err);
    throw err;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      status TEXT
    );
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY,
      authorid TEXT,
      type TEXT,
      content TEXT,
      title TEXT,
      visibility TEXT,
      tags TEXT[],
      boardid TEXT,
      timestamp TIMESTAMPTZ,
      createdat TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS quests (
      id UUID PRIMARY KEY,
      authorid TEXT,
      title TEXT,
      description TEXT,
      visibility TEXT
    );
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      boardType TEXT,
      layout TEXT,
      items JSONB,
      filters JSONB,
      featured BOOLEAN,
      defaultFor TEXT,
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      userId TEXT,
      questId TEXT
    );
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY,
      authorid TEXT,
      title TEXT,
      description TEXT,
      visibility TEXT,
      tags TEXT[]
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY,
      reviewerid TEXT,
      targettype TEXT,
      rating INT,
      visibility TEXT,
      status TEXT,
      tags TEXT[],
      feedback TEXT,
      repourl TEXT,
      modelid TEXT,
      questid TEXT,
      postid TEXT,
      createdat TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY,
      userid TEXT,
      message TEXT,
      link TEXT,
      read BOOLEAN,
      createdat TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      expires TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS reactions (
      id UUID PRIMARY KEY,
      postid TEXT,
      userid TEXT,
      type TEXT,
      createdat TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(postid, userid, type)
    );
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[];
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS boardid TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ;
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS tags TEXT[];
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS status TEXT;
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS linkedPosts JSONB;
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS taskGraph JSONB;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS questIds TEXT[];
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS deliverables TEXT[];
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS mapEdges JSONB;
  `);

  const { rows } = await pool.query(
    "SELECT id FROM boards WHERE id IN ('quest-board','timeline-board','my-posts','my-quests')"
  );
  const existing = rows.map((r) => r.id);
  const defaults = [
    { id: 'quest-board', title: 'Quest Board' },
    { id: 'timeline-board', title: 'Timeline' },
    { id: 'my-posts', title: 'My Posts' },
    { id: 'my-quests', title: 'My Quests' },
  ];
  for (const board of defaults) {
    if (!existing.includes(board.id)) {
      await pool.query(
        `INSERT INTO boards (id,title,boardType,layout,items,createdAt,userId) VALUES ($1,$2,'post','grid','[]',NOW(),'')`,
        [board.id, board.title]
      );
    }
  }
}

export { pool, usePg, disablePg, initializeDatabase };
