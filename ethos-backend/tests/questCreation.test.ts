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
}));

import { questsStore, postsStore, boardsStore } from '../src/models/stores';

const questsStoreMock = questsStore as jest.Mocked<any>;
const postsStoreMock = postsStore as jest.Mocked<any>;
const boardsStoreMock = boardsStore as jest.Mocked<any>;

const app = express();
app.use(express.json());
app.use('/quests', questRoutes);

describe('quest creation', () => {
  beforeEach(() => {
    postsStoreMock.read.mockReturnValue([]);
    boardsStoreMock.read.mockReturnValue([]);
    postsStoreMock.write.mockClear();
    questsStoreMock.write.mockClear();
  });

  it('rejects duplicate quest titles ignoring spaces and capitals', async () => {
    questsStoreMock.read.mockReturnValue([
      {
        id: 'q1',
        authorId: 'u1',
        title: 'MyQuest',
        status: 'active',
        headPostId: '',
        linkedPosts: [],
        collaborators: [],
        taskGraph: [],
      },
    ]);

    const res = await request(app).post('/quests').send({ title: 'my quest' });
    expect(res.status).toBe(400);
  });
});
