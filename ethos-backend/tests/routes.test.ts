import request from 'supertest';
import express from 'express';

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

jest.mock('../src/models/memoryStores', () => ({
  postsStore: { read: jest.fn(() => []), write: jest.fn() },
  usersStore: { read: jest.fn(() => [{ id: 'u1', username: 'user1' }]), write: jest.fn() },
  reactionsStore: { read: jest.fn(() => []), write: jest.fn() },
  questsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

import postRoutes from '../src/routes/postRoutes';
import { pool } from '../src/db';

const app = express();
app.use(express.json());
app.use('/posts', postRoutes);

describe('Postgres routes', () => {
  const postId = '11111111-1111-1111-1111-111111111111';
  const reactionId = '22222222-2222-2222-2222-222222222222';

  it('GET /posts/:id returns enriched post with tags array', async () => {
    const now = new Date();
    await pool.query(
      `INSERT INTO posts (id, authorid, type, content, title, visibility, tags, boardid, timestamp, createdat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [postId, 'u1', 'free_speech', 'hello', '', 'public', ['alpha', 'beta'], null, now, now]
    );
    const res = await request(app).get(`/posts/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body.enriched).toBe(true);
    expect(res.body.tags).toEqual(['alpha', 'beta']);
  });

  it('POST and DELETE /posts/:id/reactions/:type modify reactions', async () => {
    await pool.query(
      `INSERT INTO posts (id, authorid, type, content, title, visibility, tags, timestamp, createdat)
       VALUES ($1,'u1','free_speech','hi','', 'public', '{}', NOW(), NOW())`,
      [postId]
    );
    const resAdd = await request(app).post(`/posts/${postId}/reactions/like`);
    expect(resAdd.status).toBe(200);
    let rows = await pool.query('SELECT * FROM reactions WHERE postid=$1', [postId]);
    expect(rows.rows).toHaveLength(1);
    const resDel = await request(app).delete(`/posts/${postId}/reactions/like`);
    expect(resDel.status).toBe(200);
    rows = await pool.query('SELECT * FROM reactions WHERE postid=$1', [postId]);
    expect(rows.rows).toHaveLength(0);
  });

  it('GET /posts/:id/reactions retrieves reactions', async () => {
    await pool.query(
      `INSERT INTO posts (id, authorid, type, content, title, visibility, tags, timestamp, createdat)
       VALUES ($1,'u1','free_speech','hi','', 'public', '{}', NOW(), NOW())`,
      [postId]
    );
    await pool.query(
      `INSERT INTO reactions (id, postid, userid, type) VALUES ($1,$2,'u1','like')`,
      [reactionId, postId]
    );
    const res = await request(app).get(`/posts/${postId}/reactions`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ userId: 'u1', type: 'like' }]);
  });
});
