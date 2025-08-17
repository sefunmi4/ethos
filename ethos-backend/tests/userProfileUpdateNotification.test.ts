import request from 'supertest';
import express from 'express';
import userRoutes from '../src/routes/userRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

jest.mock('../src/db', () => ({ pool: { query: jest.fn() }, usePg: false }));

const { pool } = require('../src/db');

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

describe('user profile update notifications', () => {
  it('creates notification describing changes', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ username: 'old', bio: 'old bio' }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const res = await request(app)
      .put('/users/u1')
      .send({ username: 'new', bio: 'new bio' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'u1', username: 'new', bio: 'new bio' });

    expect(pool.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO notifications'),
      expect.arrayContaining([
        expect.any(String),
        'u1',
        expect.stringContaining('username changed from old to new'),
        '/profile/u1',
        false,
        expect.any(String),
      ])
    );
  });
});

