import request from 'supertest';
import express from 'express';

import postRoutes from '../src/routes/postRoutes';
import type { DBPost } from '../src/types/db';
import { postsStore, reactionsStore, questsStore } from '../src/models/stores';

let mockUser = { id: 'u1', username: 'user1' } as any;
jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/posts', postRoutes);

beforeEach(() => {
  postsStore.write([]);
  reactionsStore.write([]);
  questsStore.write([]);
});

describe('help request routes', () => {
  it('creates a help request for a post', async () => {
    const task: DBPost = {
      id: 'p1',
      authorId: 'u2',
      type: 'task',
      content: 'need help',
      visibility: 'public',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    } as DBPost;
    postsStore.write([task]);

    const res = await request(app).post('/posts/p1/request-help');
    expect(res.status).toBe(201);
    const posts = postsStore.read();
    expect(posts).toHaveLength(2);
    expect(posts[0].requestId).toBeDefined();
    const requestPost = posts.find(p => p.id === posts[0].requestId);
    expect(requestPost?.authorId).toBe('u1');
    const reactions = reactionsStore.read();
    expect(reactions).toContain('p1_u1_request');
  });

  it('accepts and declines a help request', async () => {
    const reqPost: DBPost = {
      id: 'r1',
      authorId: 'u2',
      type: 'request',
      content: '',
      visibility: 'public',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      tags: ['request'],
    } as DBPost;
    postsStore.write([reqPost]);

    let res = await request(app).post('/posts/r1/accept');
    expect(res.status).toBe(200);
    expect(postsStore.read()[0].tags).toContain('pending:u1');

    res = await request(app).post('/posts/r1/unaccept');
    expect(res.status).toBe(200);
    expect(postsStore.read()[0].tags).not.toContain('pending:u1');
  });

  it('handles duplicate help requests for tasks', async () => {
    const task: DBPost = {
      id: 't1',
      authorId: 'u2',
      type: 'task',
      content: 'task',
      visibility: 'public',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    } as DBPost;
    postsStore.write([task]);

    await request(app).post('/posts/tasks/t1/request-help');
    await request(app).post('/posts/tasks/t1/request-help');

    const posts = postsStore.read();
    expect(posts).toHaveLength(1);
    expect(posts[0].tags).toContain('request');
    const reactions = reactionsStore.read();
    expect(reactions).toHaveLength(1);
  });

  it('prevents non-creator from deleting a request', async () => {
    const original: DBPost = {
      id: 'p1',
      authorId: 'u2',
      type: 'task',
      content: 'task',
      visibility: 'public',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    } as DBPost;
    postsStore.write([original]);
    await request(app).post('/posts/p1/request-help');

    mockUser = { id: 'u2', username: 'user2' } as any;
    const res = await request(app).delete('/posts/p1/request-help');
    expect(res.status).toBe(404);
  });
});

