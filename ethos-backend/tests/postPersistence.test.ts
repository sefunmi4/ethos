import request from 'supertest';
import express from 'express';

import postRoutes from '../src/routes/postRoutes';
import { setupTestDb } from './testDb';
import { pool } from '../src/db';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/posts', postRoutes);

beforeAll(async () => {
  await setupTestDb();
});

describe('post persistence', () => {
  it('stores title, content, and details for task posts', async () => {
    const res = await request(app)
      .post('/posts')
      .send({ type: 'task', title: 'My task', content: 'More info', details: 'More info' });
    expect(res.status).toBe(201);
    const id = res.body.id;
    const dbRes = await pool.query('SELECT nodeid, details, title, content FROM posts WHERE id=$1', [id]);
    expect(dbRes.rows[0].nodeid).toBe('T00');
    expect(dbRes.rows[0].details).toBe('More info');
    expect(dbRes.rows[0].title).toBe('My task');
    expect(dbRes.rows[0].content).toBe('More info');
  });
});
