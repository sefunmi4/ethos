import request from 'supertest';
import express from 'express';
import type { DBPost } from '../src/types/db';
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
  questsStore: { read: jest.fn(() => []), write: jest.fn() },
  notificationsStore: { read: jest.fn(() => []), write: jest.fn() },
  boardsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

jest.mock('../src/db', () => ({ pool: { query: jest.fn() }, usePg: false }));

const { postsStore, reactionsStore, boardsStore } = require('../src/models/stores');

const app = express();
app.use(express.json());
app.use('/posts', postRoutes);

describe('post deletion removes linked requests', () => {
  it('deletes request posts and reactions', async () => {
    const original: DBPost = {
      id: 'p1',
      authorId: 'u1',
      type: 'task',
      content: '',
      visibility: 'public',
      timestamp: '',
      replyTo: null,
    };
    const helpReq: DBPost = {
      id: 'r1',
      authorId: 'u1',
      type: 'request',
      content: '',
      visibility: 'public',
      timestamp: '',
      repostedFrom: 'p1',
      tags: ['request'],
    };
    const reviewReq: DBPost = {
      id: 'r2',
      authorId: 'u1',
      type: 'request',
      content: '',
      visibility: 'public',
      timestamp: '',
      repostedFrom: 'p1',
      tags: ['request', 'review'],
    };
    const posts = [original, helpReq, reviewReq];
    postsStore.read.mockReturnValue(posts);
    postsStore.write.mockClear();
    reactionsStore.read.mockReturnValue(['p1_u1_request', 'p1_u1_review', 'x_u1_like']);
    reactionsStore.write.mockClear();
    boardsStore.read.mockReturnValue([{ id: 'quest-board', items: ['r1', 'r2'] }]);
    boardsStore.write.mockClear();

    const res = await request(app).delete('/posts/p1');
    expect(res.status).toBe(200);
    const writtenPosts = postsStore.write.mock.calls[0][0];
    expect(writtenPosts).toHaveLength(0);
    const writtenReactions = reactionsStore.write.mock.calls[0][0];
    expect(writtenReactions).toEqual(['x_u1_like']);
    const writtenBoards = boardsStore.write.mock.calls[0][0];
    expect(writtenBoards[0].items).toHaveLength(0);
  });
});
