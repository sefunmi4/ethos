import request from 'supertest';
import express from 'express';

import postRoutes from '../src/routes/postRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

jest.mock('../src/models/stores', () => ({
  postsStore: { read: jest.fn(() => []), write: jest.fn() },
  usersStore: { read: jest.fn(() => []), write: jest.fn() },
  reactionsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

const app = express();
app.use(express.json());
app.use('/posts', postRoutes);

describe('post routes', () => {
  it('POST /posts creates a post', async () => {
    const res = await request(app)
      .post('/posts')
      .send({ type: 'free_speech', content: 'hello', visibility: 'public' });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('hello');
  });
});
