import request from 'supertest';
import express from 'express';

import postRoutes from '../src/routes/postRoutes';
import { setupTestDb } from './testDb';
import { postsStore } from '../src/models/stores';

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

beforeEach(() => {
  postsStore.write([]);
});

describe('task join requests', () => {
  it('creates a system post and returns requestId', async () => {
    const createRes = await request(app)
      .post('/posts')
      .send({ type: 'task', title: 'Task', content: 'Body' });
    const taskId = createRes.body.id;

    const res = await request(app)
      .post(`/posts/tasks/${taskId}/join-requests`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.requestId).toBeDefined();
    expect(res.body.post.content).toBe('@u1 requested to join this task.');
    expect(res.body.post.tags).toContain('status:Pending');
    const posts = postsStore.read();
    const joinPost = posts.find(p => p.requestId === res.body.requestId);
    expect(joinPost?.replyTo).toBe(taskId);
  });
});
