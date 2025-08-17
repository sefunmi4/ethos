import request from 'supertest';
import express from 'express';

import postRoutes from '../src/routes/postRoutes';
import { postsStore } from '../src/models/stores';

let mockUser = { id: 'u1', username: 'user1' } as any;
jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/posts', postRoutes);

beforeEach(() => {
  postsStore.write([]);
});

describe('file post creation', () => {
  it('creates standalone file post with empty linkedItems', async () => {
    const res = await request(app).post('/api/posts').send({ type: 'file' });
    expect(res.status).toBe(201);
    expect(res.body.linkedItems).toEqual([]);
  });
});
