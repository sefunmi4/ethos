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
  questsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

const { postsStore, questsStore, usersStore } = require('../src/models/stores');
const { generateNodeId } = require('../src/utils/nodeIdUtils');

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

  it('PATCH /posts/:id regenerates nodeId on quest change for quest post', async () => {
    const posts = [
      {
        id: 'p1',
        authorId: 'u1',
        type: 'quest',
        content: '',
        visibility: 'public',
        timestamp: '',
        questId: 'q1',
        replyTo: null,
        nodeId: 'Q:firstquest:T00',
      },
    ];

    postsStore.read.mockReturnValue(posts);
    questsStore.read.mockReturnValue([
      { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
      { id: 'q2', title: 'Second Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
    ]);
    usersStore.read.mockReturnValue([]);

    const res = await request(app).patch('/posts/p1').send({ questId: 'q2' });

    const expected = generateNodeId({
      quest: { id: 'q2', title: 'Second Quest' },
      posts: [],
      postType: 'quest',
      parentPost: null,
    });

    expect(res.status).toBe(200);
    expect(posts[0].nodeId).toBe(expected);
    expect(res.body.nodeId).toBe(expected);
  });

  it('PATCH /posts/:id regenerates nodeId on quest change for task', async () => {
    const posts = [
      {
        id: 't1',
        authorId: 'u1',
        type: 'task',
        content: '',
        visibility: 'public',
        timestamp: '',
        questId: 'q1',
        replyTo: null,
        nodeId: 'Q:firstquest:T00',
      },
      {
        id: 't2',
        authorId: 'u1',
        type: 'task',
        content: '',
        visibility: 'public',
        timestamp: '',
        questId: 'q2',
        replyTo: null,
        nodeId: 'Q:secondquest:T00',
      },
    ];

    postsStore.read.mockReturnValue(posts);
    questsStore.read.mockReturnValue([
      { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
      { id: 'q2', title: 'Second Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
    ]);
    usersStore.read.mockReturnValue([]);

    const res = await request(app).patch('/posts/t1').send({ questId: 'q2' });

    const expected = generateNodeId({
      quest: { id: 'q2', title: 'Second Quest' },
      posts: [posts[1]],
      postType: 'task',
      parentPost: null,
    });

    expect(res.status).toBe(200);
    expect(posts[0].nodeId).toBe(expected);
    expect(res.body.nodeId).toBe(expected);
  });

  it('PATCH /posts/:id regenerates nodeId on replyTo change for log', async () => {
    const posts = [
      {
        id: 'p1',
        authorId: 'u1',
        type: 'task',
        content: '',
        visibility: 'public',
        timestamp: '',
        questId: 'q1',
        replyTo: null,
        nodeId: 'Q:firstquest:T00',
      },
      {
        id: 'p2',
        authorId: 'u1',
        type: 'task',
        content: '',
        visibility: 'public',
        timestamp: '',
        questId: 'q1',
        replyTo: null,
        nodeId: 'Q:firstquest:T01',
      },
      {
        id: 'l1',
        authorId: 'u1',
        type: 'log',
        content: '',
        visibility: 'public',
        timestamp: '',
        questId: 'q1',
        replyTo: 'p1',
        nodeId: 'Q:firstquest:T00:L00',
      },
    ];

    postsStore.read.mockReturnValue(posts);
    questsStore.read.mockReturnValue([
      { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
    ]);
    usersStore.read.mockReturnValue([]);

    const res = await request(app).patch('/posts/l1').send({ replyTo: 'p2' });

    const expected = generateNodeId({
      quest: { id: 'q1', title: 'First Quest' },
      posts: posts.filter((p) => p.id !== 'l1'),
      postType: 'log',
      parentPost: posts[1],
    });

    expect(res.status).toBe(200);
    expect(posts[2].nodeId).toBe(expected);
    expect(res.body.nodeId).toBe(expected);
  });

  it('PATCH /posts/:id regenerates nodeId on type change', async () => {
    const posts = [
      {
        id: 't1',
        authorId: 'u1',
        type: 'task',
        content: '',
        visibility: 'public',
        timestamp: '',
        questId: 'q1',
        replyTo: null,
        nodeId: 'Q:firstquest:T00',
      },
    ];

    postsStore.read.mockReturnValue(posts);
    questsStore.read.mockReturnValue([
      { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
    ]);
    usersStore.read.mockReturnValue([]);

    const res = await request(app).patch('/posts/t1').send({ type: 'issue' });

    const expected = generateNodeId({
      quest: { id: 'q1', title: 'First Quest' },
      posts: [],
      postType: 'issue',
      parentPost: null,
    });

    expect(res.status).toBe(200);
    expect(posts[0].nodeId).toBe(expected);
    expect(res.body.nodeId).toBe(expected);
  });
});
