import request from 'supertest';
import express from 'express';

import questRoutes from '../src/routes/questRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => { _req.user = { id: 'u1' }; next(); }
}));

jest.mock('../src/models/stores', () => ({
  questsStore: { read: jest.fn(() => []), write: jest.fn() },
  postsStore: { read: jest.fn(() => []), write: jest.fn() },
  boardsStore: { read: jest.fn(() => []), write: jest.fn() },
  usersStore: { read: jest.fn(() => [{ id: 'u1', role: 'moderator' }]), write: jest.fn() }
}));

import { questsStore, postsStore } from '../src/models/stores';

const app = express();
app.use(express.json());
app.use('/quests', questRoutes);

describe('quest moderation routes', () => {
  it('GET /quests/featured returns sorted quests', async () => {
    questsStore.read.mockReturnValue([
      { id: 'q1', authorId: 'u1', title: 'A', headPostId: '', linkedPosts: [], collaborators: [], status: 'active', visibility: 'public', approvalStatus: 'approved', flagCount: 0 },
      { id: 'q2', authorId: 'u1', title: 'B', headPostId: '', linkedPosts: ['p1'], collaborators: [], status: 'active', visibility: 'public', approvalStatus: 'approved', flagCount: 0 }
    ]);
    postsStore.read.mockReturnValue([{ id: 'p1', questId: 'q2', authorId: 'u1', type: 'task', content: '', visibility: 'public', timestamp: '' }]);

    const res = await request(app).get('/quests/featured');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe('q2');
    expect(res.body).toHaveLength(2);
  });

  it('POST /quests/:id/flag increments flag count and creates review post', async () => {
    questsStore.read.mockReturnValue([
      { id: 'q1', authorId: 'u1', title: 'A', headPostId: '', linkedPosts: [], collaborators: [], status: 'active', visibility: 'public', approvalStatus: 'approved', flagCount: 2 }
    ]);
    postsStore.read.mockReturnValue([]);
    postsStore.write.mockClear();

    const res = await request(app).post('/quests/q1/flag');
    expect(res.status).toBe(200);
    const updated = questsStore.write.mock.calls[0][0][0];
    expect(updated.flagCount).toBe(3);
    expect(postsStore.write).toHaveBeenCalled();
  });
});
