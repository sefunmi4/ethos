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
  it('stores nodeId and details for task posts', async () => {
    const res = await request(app)
      .post('/posts')
      .send({ type: 'task', content: 'My task', details: 'More info' });
    expect(res.status).toBe(201);
    const id = res.body.id;
    const dbRes = await pool.query('SELECT nodeid, details FROM posts WHERE id=$1', [id]);
    expect(dbRes.rows[0].nodeid).toBe('T00');
    expect(dbRes.rows[0].details).toBe('More info');
  });
});
