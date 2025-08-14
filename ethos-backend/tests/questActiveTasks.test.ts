import request from 'supertest';
import express from 'express';

import questRoutes from '../src/routes/questRoutes';

jest.mock('../src/middleware/authOptional', () => ({
  __esModule: true,
  default: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../src/models/memoryStores', () => ({
  postsStore: { read: jest.fn(() => []), write: jest.fn() },
  questsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

import { postsStore, questsStore } from '../src/models/memoryStores';

const postsStoreMock = postsStore as jest.Mocked<any>;
const questsStoreMock = questsStore as jest.Mocked<any>;

const app = express();
app.use(express.json());
app.use('/quests', questRoutes);

describe('questRoutes /active includeTasks', () => {
  it('returns only root tasks with nodeId T00', async () => {
    const quest = {
      id: 'q1',
      authorId: 'u2',
      title: 'Quest',
      visibility: 'public',
      approvalStatus: 'approved',
      status: 'active',
      headPostId: '',
      linkedPosts: [],
      collaborators: [],
      taskGraph: [],
    };
    questsStoreMock.read.mockReturnValue([quest]);

    const posts = [
      {
        id: 't1',
        authorId: 'u2',
        type: 'task',
        content: 'Root',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
        questId: 'q1',
        nodeId: 'Q:quest:T00',
      },
      {
        id: 't2',
        authorId: 'u2',
        type: 'task',
        content: 'Child',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
        questId: 'q1',
        nodeId: 'Q:quest:T00:T01',
      },
    ];
    postsStoreMock.read.mockReturnValue(posts);

    const res = await request(app).get('/quests/active?includeTasks=1');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].id).toBe('t1');
  });
});

