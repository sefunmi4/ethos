import request from 'supertest';
import express from 'express';

import boardRoutes from '../src/routes/boardRoutes';
import questRoutes from '../src/routes/questRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

jest.mock('../src/models/stores', () => ({
  boardsStore: {
    read: jest.fn(() => [
      { id: 'b1', title: 'Board', description: '', layout: 'grid', items: [] },
      { id: 'home', title: 'Home', description: '', layout: 'grid', items: [], defaultFor: 'home' },
    ]),
    write: jest.fn(),
  },
  postsStore: {
    read: jest.fn(() => []),
    write: jest.fn(),
  },
  questsStore: {
    read: jest.fn(() => [
      {
        id: 'q1',
        authorId: 'u1',
        title: 'Quest',
        status: 'active',
        headPostId: '',
        linkedPosts: [],
        collaborators: [],
        taskGraph: [],
      },
    ]),
    write: jest.fn(),
  },
  usersStore: { read: jest.fn(() => []), write: jest.fn() },
  reactionsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

const app = express();
app.use(express.json());
app.use('/boards', boardRoutes);
app.use('/quests', questRoutes);

describe('route handlers', () => {
  it('GET /boards returns boards', async () => {
    const res = await request(app).get('/boards');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe('b1');
  });

  it('GET /quests returns quests', async () => {
    const res = await request(app).get('/quests');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('q1');
  });

  it('GET /boards/:id returns single board', async () => {
    const res = await request(app).get('/boards/b1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('b1');
  });

  it('GET /boards/default/home returns default board', async () => {
    const res = await request(app).get('/boards/default/home');
    expect(res.status).toBe(200);
    expect(res.body.defaultFor).toBe('home');
  });

  it('GET /quests/:id returns quest', async () => {
    const res = await request(app).get('/quests/q1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('q1');
  });
  
  it('POST /quests/:id/collaborators adds open role', async () => {
    const res = await request(app)
      .post('/quests/q1/collaborators')
      .send({ roles: ['designer'] });
    expect(res.status).toBe(200);
    expect(res.body.collaborators).toHaveLength(1);
    expect(res.body.collaborators[0].roles).toContain('designer');
    expect(res.body.collaborators[0].userId).toBeUndefined();
  });

  it('GET /quests/:id/map returns nodes and edges', async () => {
    const { postsStore, questsStore } = require('../src/models/stores');
    postsStore.read.mockReturnValue([
      {
        id: 't1',
        authorId: 'u1',
        type: 'task',
        content: '',
        visibility: 'public',
        timestamp: '',
        questId: 'q1',
      },
    ]);
    questsStore.read.mockReturnValue([
      {
        id: 'q1',
        authorId: 'u1',
        title: 'Quest',
        status: 'active',
        headPostId: '',
        linkedPosts: [],
        collaborators: [],
        taskGraph: [{ from: '', to: 't1' }],
      },
    ]);
    const res = await request(app).get('/quests/q1/map');
    expect(res.status).toBe(200);
    expect(res.body.nodes).toHaveLength(1);
    expect(res.body.edges).toHaveLength(1);
  });

  it('POST /quests/:id/link adds task edge with type and label', async () => {
    const { postsStore, questsStore } = require('../src/models/stores');
    const quest: any = {
      id: 'q1',
      authorId: 'u1',
      title: 'Quest',
      status: 'active',
      headPostId: 'h1',
      linkedPosts: [],
      collaborators: [],
      taskGraph: [] as any[],
    };
    questsStore.read.mockReturnValue([quest]);
    postsStore.read.mockReturnValue([
      {
        id: 't1',
        authorId: 'u1',
        type: 'task',
        content: '',
        visibility: 'public',
        timestamp: '',
      },
    ]);

    const res = await request(app)
      .post('/quests/q1/link')
      .send({ postId: 't1', edgeType: 'sub_problem', edgeLabel: 'relates' });

    expect(res.status).toBe(200);
    expect(quest.taskGraph).toHaveLength(1);
    expect(quest.taskGraph[0]).toEqual({
      from: 'h1',
      to: 't1',
      type: 'sub_problem',
      label: 'relates',
    });
  });

  it('POST /quests/:id/link links task to task when parentId provided', async () => {
    const { postsStore, questsStore } = require('../src/models/stores');
    const quest: any = {
      id: 'q1',
      authorId: 'u1',
      title: 'Quest',
      status: 'active',
      headPostId: 'h1',
      linkedPosts: [],
      collaborators: [],
      taskGraph: [] as any[],
    };
    questsStore.read.mockReturnValue([quest]);
    postsStore.read.mockReturnValue([
      {
        id: 't1',
        authorId: 'u1',
        type: 'task',
        content: '',
        visibility: 'public',
        timestamp: '',
      },
      {
        id: 't2',
        authorId: 'u1',
        type: 'task',
        content: '',
        visibility: 'public',
        timestamp: '',
      },
    ]);

    const res = await request(app)
      .post('/quests/q1/link')
      .send({ postId: 't2', parentId: 't1' });

    expect(res.status).toBe(200);
    expect(quest.taskGraph).toHaveLength(1);
    expect(quest.taskGraph[0]).toEqual({ from: 't1', to: 't2', type: undefined, label: undefined });
  });

  it('GET /boards/:id/quests returns quests from board', async () => {
    const { boardsStore, questsStore } = require('../src/models/stores');
    boardsStore.read.mockReturnValue([
      { id: 'b1', title: 'Board', description: '', layout: 'grid', items: ['q1'] },
    ]);
    questsStore.read.mockReturnValue([
      {
        id: 'q1',
        authorId: 'u1',
        title: 'Quest',
        status: 'active',
        headPostId: '',
        linkedPosts: [],
        collaborators: [],
        taskGraph: [],
      },
    ]);
    const res = await request(app).get('/boards/b1/quests');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('q1');
  });

  it('GET /boards/:id/quests?enrich=true returns enriched quests', async () => {
    const { boardsStore, questsStore, usersStore } = require('../src/models/stores');
    boardsStore.read.mockReturnValue([
      { id: 'b1', title: 'Board', description: '', layout: 'grid', items: ['q1'] },
    ]);
    questsStore.read.mockReturnValue([
      {
        id: 'q1',
        authorId: 'u1',
        title: 'Quest',
        status: 'active',
        headPostId: '',
        linkedPosts: [],
        collaborators: [],
        taskGraph: [],
      },
    ]);
    usersStore.read.mockReturnValue([{ id: 'u1', username: 'test', role: 'user' }]);
    const res = await request(app).get('/boards/b1/quests?enrich=true');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('logs');
  });

  it('PATCH /boards/:id creates board when not found', async () => {
    const { boardsStore } = require('../src/models/stores');
    const store: any[] = [];
    boardsStore.read.mockReturnValue(store);

    const res = await request(app)
      .patch('/boards/new-board')
      .send({ title: 'New Board', items: ['i1'] });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('new-board');
    expect(store).toHaveLength(1);
    expect(store[0].items).toContain('i1');
  });
});
