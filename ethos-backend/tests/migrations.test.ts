import { newDb } from 'pg-mem';
import { setTestPool, initializeDatabase } from '../src/db';

describe('database migrations', () => {
  it('adds missing columns to posts table and preserves data', async () => {
    const db = newDb({ noAstCoverageCheck: true });
    const pg = db.adapters.createPg();
    const pool = new pg.Pool();
    setTestPool(pool);

    await pool.query(`
      CREATE TABLE posts (
        id UUID PRIMARY KEY,
        authorid TEXT,
        type TEXT,
        content TEXT,
        title TEXT,
        visibility TEXT,
        tags TEXT[],
        boardid TEXT,
        timestamp TIMESTAMPTZ,
        createdat TIMESTAMPTZ DEFAULT NOW(),
        version INT DEFAULT 1
      );
    `);

    await pool.query(`
      INSERT INTO posts (id, authorid, type, content, title, visibility, tags, boardid, timestamp)
      VALUES ('00000000-0000-0000-0000-000000000001', 'user1', 'task', 'content', 'title', 'public', ARRAY[]::text[], 'board', NOW());
    `);

    await initializeDatabase();

    const res = await pool.query(
      "SELECT details, nodeid, status FROM posts WHERE id = '00000000-0000-0000-0000-000000000001'"
    );

    expect(res.rows[0]).toEqual({ details: null, nodeid: null, status: null });

    await pool.end();
  });

  it('adds version column to users table with default value', async () => {
    const db = newDb({ noAstCoverageCheck: true });
    const pg = db.adapters.createPg();
    const pool = new pg.Pool();
    setTestPool(pool);

    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        username TEXT,
        email TEXT,
        password TEXT,
        role TEXT,
        status TEXT
      );
    `);

    await pool.query(`
      INSERT INTO users (id, username, email, password, role, status)
      VALUES ('00000000-0000-0000-0000-000000000002', 'olduser', 'old@example.com', 'hash', 'member', 'active');
    `);

    await initializeDatabase();

    const result = await pool.query(
      "SELECT version FROM users WHERE id = '00000000-0000-0000-0000-000000000002'"
    );

    expect(result.rows[0]).toHaveProperty('version');

    await pool.end();
  });
});
