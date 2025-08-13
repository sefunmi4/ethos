import request from 'supertest';
import express from 'express';

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
  usePg: true,
}));

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

jest.mock('../src/models/stores', () => ({
  postsStore: { read: jest.fn(() => []), write: jest.fn() },
  usersStore: { read: jest.fn(() => [{ id: 'u1', username: 'user1' }]), write: jest.fn() },
  reactionsStore: { read: jest.fn(() => []), write: jest.fn() },
  questsStore: { read: jest.fn(() => []), write: jest.fn() },
  notificationsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

import postRoutes from '../src/routes/postRoutes';
import { pool } from '../src/db';

const app = express();
app.use(express.json());
app.use('/posts', postRoutes);

describe('Postgres routes', () => {
  it('GET /posts/:id returns enriched post with tags array', async () => {
    const now = new Date();
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          id: 'p1',
          authorid: 'u1',
          type: 'free_speech',
          content: 'hello',
          title: '',
          visibility: 'public',
          tags: '{"alpha","beta"}',
          boardid: null,
          timestamp: now,
          createdat: now,
        },
      ],
    });

    const res = await request(app).get('/posts/p1');
    expect(res.status).toBe(200);
    expect(res.body.enriched).toBe(true);
    expect(res.body.tags).toEqual(['alpha', 'beta']);
  });

  it('POST and DELETE /posts/:id/reactions/:type modify reactions', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const resAdd = await request(app).post('/posts/p1/reactions/like');
    expect(resAdd.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reactions'),
      expect.any(Array)
    );

    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const resDel = await request(app).delete('/posts/p1/reactions/like');
    expect(resDel.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM reactions'),
      ['p1', 'u1', 'like']
    );
  });

  it('GET /posts/:id/reactions retrieves reactions', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ userId: 'u1', type: 'like' }],
    });
    const res = await request(app).get('/posts/p1/reactions');
    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT userid AS "userId", type FROM reactions'),
      ['p1']
    );
    expect(res.body).toEqual([{ userId: 'u1', type: 'like' }]);
  });
});

