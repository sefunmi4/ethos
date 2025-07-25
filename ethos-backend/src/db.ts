import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Ensure required tables and starter data exist when using PostgreSQL.
 * This allows fresh deployments to work without running separate migrations.
 */
export async function initializeDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

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
