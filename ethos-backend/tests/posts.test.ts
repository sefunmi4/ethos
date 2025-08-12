import request from 'supertest';
import express from 'express';

import postRoutes from '../src/routes/postRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1', username: 'user' };
    next();
  },
}));

jest.mock('../src/models/stores', () => ({
  postsStore: { read: jest.fn(() => []), write: jest.fn() },
  usersStore: { read: jest.fn(() => []), write: jest.fn() },
  reactionsStore: { read: jest.fn(() => []), write: jest.fn() },
  questsStore: { read: jest.fn(() => []), write: jest.fn() },
  notificationsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

import { postsStore } from '../src/models/stores';

const postsStoreMock = postsStore as jest.Mocked<any>;

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

  it('assigns nodeId T00 to tasks without quest or parent', async () => {
    postsStoreMock.read.mockReturnValue([]);
    const res = await request(app)
      .post('/posts')
      .send({ type: 'task', content: 'root task' });
    expect(res.status).toBe(201);
    expect(res.body.nodeId).toBe('T00');
  });

  it('rejects change post without parent', async () => {
    postsStoreMock.read.mockReturnValue([]);
    const res = await request(app).post('/posts').send({ type: 'change' });
    expect(res.status).toBe(400);
  });

  it('allows change post replying to task', async () => {
    const task = { id: 't1', authorId: 'u1', type: 'task', content: '', visibility: 'public', timestamp: '' };
    postsStoreMock.read.mockReturnValue([task]);
    const res = await request(app)
      .post('/posts')
      .send({ type: 'change', replyTo: 't1' });
    expect(res.status).toBe(201);
  });

  it('disallows change requests replying to tasks', async () => {
    const task = { id: 't1', authorId: 'u1', type: 'task', content: '', visibility: 'public', timestamp: '' };
    postsStoreMock.read.mockReturnValue([task]);
    let res = await request(app)
      .post('/posts')
      .send({ type: 'request', subtype: 'change', content: 'req' });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/posts')
      .send({ type: 'request', subtype: 'change', content: 'req', replyTo: 't1' });
    expect(res.status).toBe(400);
  });

  it('reviews must reply to a request', async () => {
    const requestPost = { id: 'r1', authorId: 'u1', type: 'request', content: '', visibility: 'public', timestamp: '', subtype: 'task' };
    postsStoreMock.read.mockReturnValue([requestPost]);
    let res = await request(app).post('/posts').send({ type: 'review' });
    expect(res.status).toBe(400);
    res = await request(app).post('/posts').send({ type: 'review', replyTo: 'r1' });
    expect(res.status).toBe(201);
  });

  it('rejects task replying to change', async () => {
    const change = { id: 'c1', authorId: 'u1', type: 'change', content: '', visibility: 'public', timestamp: '' };
    postsStoreMock.read.mockReturnValue([change]);
    const res = await request(app)
      .post('/posts')
      .send({ type: 'task', replyTo: 'c1' });
    expect(res.status).toBe(400);
  });

  it('restricts replies to task posts', async () => {
    const task = { id: 't1', authorId: 'u1', type: 'task', content: '', visibility: 'public', timestamp: '' };
    postsStoreMock.read.mockReturnValue([task]);
    let res = await request(app)
      .post('/posts')
      .send({ type: 'request', replyTo: 't1', subtype: 'task' });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/posts')
      .send({ type: 'review', replyTo: 't1' });
    expect(res.status).toBe(400);
  });

  it('restricts replies to change posts', async () => {
    const change = { id: 'c1', authorId: 'u1', type: 'change', content: '', visibility: 'public', timestamp: '' };
    postsStoreMock.read.mockReturnValue([change]);
    let res = await request(app)
      .post('/posts')
      .send({ type: 'free_speech', replyTo: 'c1' });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/posts')
      .send({ type: 'change', replyTo: 'c1' });
    expect(res.status).toBe(201);
  });
});
