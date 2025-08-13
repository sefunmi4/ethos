import request from 'supertest';
import express from 'express';

import postRoutes from '../src/routes/postRoutes';

export let authUserId = 'u1';
jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    const { authUserId } = require('./posts.test');
    req.user = { id: authUserId, username: 'user' };
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
  beforeEach(() => {
    authUserId = 'u1';
  });
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

  it('rejects file post without parent', async () => {
    postsStoreMock.read.mockReturnValue([]);
    const res = await request(app).post('/posts').send({ type: 'file' });
    expect(res.status).toBe(400);
  });

  it('allows file post replying to task', async () => {
    const task = { id: 't1', authorId: 'u1', type: 'task', content: '', visibility: 'public', timestamp: '' };
    postsStoreMock.read.mockReturnValue([task]);
    const res = await request(app)
      .post('/posts')
      .send({ type: 'file', replyTo: 't1' });
    expect(res.status).toBe(201);
  });

  it('disallows file requests replying to tasks', async () => {
    const task = { id: 't1', authorId: 'u1', type: 'task', content: '', visibility: 'public', timestamp: '' };
    postsStoreMock.read.mockReturnValue([task]);
    let res = await request(app)
      .post('/posts')
      .send({ type: 'request', subtype: 'file', content: 'req' });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/posts')
      .send({ type: 'request', subtype: 'file', content: 'req', replyTo: 't1' });
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

  it('rejects task replying to file', async () => {
    const file = { id: 'f1', authorId: 'u1', type: 'file', content: '', visibility: 'public', timestamp: '' };
    postsStoreMock.read.mockReturnValue([file]);
    const res = await request(app)
      .post('/posts')
      .send({ type: 'task', replyTo: 'f1' });
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

  it('restricts replies to file posts', async () => {
    const file = { id: 'f1', authorId: 'u1', type: 'file', content: '', visibility: 'public', timestamp: '' };
    postsStoreMock.read.mockReturnValue([file]);
    let res = await request(app)
      .post('/posts')
      .send({ type: 'free_speech', replyTo: 'f1' });
    expect(res.status).toBe(201);
    res = await request(app)
      .post('/posts')
      .send({ type: 'file', replyTo: 'f1' });
    expect(res.status).toBe(201);
  });

  it('limits non-participants replying to tasks', async () => {
    const task = { id: 't1', authorId: 'u2', type: 'task', content: '', visibility: 'public', timestamp: '', collaborators: [] };
    postsStoreMock.read.mockReturnValue([task]);
    let res = await request(app)
      .post('/posts')
      .send({ type: 'file', replyTo: 't1' });
    expect(res.status).toBe(400);
    res = await request(app)
      .post('/posts')
      .send({ type: 'free_speech', replyTo: 't1' });
    expect(res.status).toBe(201);
  });
});
