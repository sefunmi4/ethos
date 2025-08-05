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
  notificationsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

import { postsStore, questsStore, usersStore, reactionsStore, notificationsStore } from '../src/models/stores';

const postsStoreMock = postsStore as jest.Mocked<any>;
const questsStoreMock = questsStore as jest.Mocked<any>;
const usersStoreMock = usersStore as jest.Mocked<any>;
const reactionsStoreMock = reactionsStore as jest.Mocked<any>;
import { generateNodeId } from '../src/utils/nodeIdUtils';

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

  it("POST /posts defaults task status to 'To Do'", async () => {
    postsStoreMock.read.mockReturnValue([]);
    postsStoreMock.write.mockClear();
    const res = await request(app).post('/posts').send({ type: 'task' });
    expect(res.status).toBe(201);
    const written = postsStoreMock.write.mock.calls[0][0][0];
    expect(written.status).toBe('To Do');
    expect(res.body.status).toBe('To Do');
  });

  it('POST /posts uses provided task status', async () => {
    postsStoreMock.read.mockReturnValue([]);
    postsStoreMock.write.mockClear();
    const res = await request(app)
      .post('/posts')
      .send({ type: 'task', status: 'Blocked' });
    expect(res.status).toBe(201);
    const written = postsStoreMock.write.mock.calls[0][0][0];
    expect(written.status).toBe('Blocked');
    expect(res.body.status).toBe('Blocked');
  });

  it('POST /posts links task to quest taskGraph', async () => {
    const quest: any = {
      id: 'q1',
      title: 'Quest',
      status: 'active',
      headPostId: '',
      linkedPosts: [],
      collaborators: [],
      taskGraph: [] as any[],
    };
    postsStoreMock.read.mockReturnValue([]);
    questsStoreMock.read.mockReturnValue([quest]);
    postsStoreMock.write.mockClear();
    questsStoreMock.write.mockClear();

    const res = await request(app).post('/posts').send({ type: 'task', questId: 'q1' });

    expect(res.status).toBe(201);
    const newPost = postsStoreMock.write.mock.calls[0][0][0];
    expect(quest.taskGraph).toHaveLength(1);
    expect(quest.taskGraph[0]).toEqual({ from: '', to: newPost.id });
    expect(questsStoreMock.write).toHaveBeenCalled();
  });

  it('POST /posts links task to parent when replyTo is set', async () => {
    const quest: any = {
      id: 'q1',
      title: 'Quest',
      status: 'active',
      headPostId: 'h1',
      linkedPosts: [],
      collaborators: [],
      taskGraph: [] as any[],
    };
    const parent = {
      id: 't1',
      authorId: 'u1',
      type: 'task',
      content: '',
      visibility: 'public',
      timestamp: '',
      questId: 'q1',
      replyTo: null,
    } as any;

    postsStoreMock.read.mockReturnValue([parent]);
    questsStoreMock.read.mockReturnValue([quest]);
    postsStoreMock.write.mockClear();
    questsStoreMock.write.mockClear();

    const res = await request(app)
      .post('/posts')
      .send({ type: 'task', questId: 'q1', replyTo: 't1' });

    expect(res.status).toBe(201);
    const newPost = postsStoreMock.write.mock.calls[0][0][1];
    expect(quest.taskGraph).toHaveLength(1);
    expect(quest.taskGraph[0]).toEqual({ from: 't1', to: newPost.id });
    expect(questsStoreMock.write).toHaveBeenCalled();
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
        nodeId: 'Q:first_quest:T00',
      },
    ];

    postsStoreMock.read.mockReturnValue(posts);
    questsStoreMock.read.mockReturnValue([
      { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
      { id: 'q2', title: 'Second Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
    ]);
    usersStoreMock.read.mockReturnValue([]);

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
        nodeId: 'Q:first_quest:T00',
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
        nodeId: 'Q:second_quest:T00',
      },
    ];

    postsStoreMock.read.mockReturnValue(posts);
    questsStoreMock.read.mockReturnValue([
      { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
      { id: 'q2', title: 'Second Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
    ]);
    usersStoreMock.read.mockReturnValue([]);

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
        nodeId: 'Q:first_quest:T00',
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
        nodeId: 'Q:first_quest:T01',
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
        nodeId: 'Q:first_quest:T00:L00',
      },
    ];

    postsStoreMock.read.mockReturnValue(posts);
    questsStoreMock.read.mockReturnValue([
      { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
    ]);
    usersStoreMock.read.mockReturnValue([]);

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
        nodeId: 'Q:first_quest:T00',
      },
    ];

    postsStoreMock.read.mockReturnValue(posts);
    questsStoreMock.read.mockReturnValue([
      { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
    ]);
    usersStoreMock.read.mockReturnValue([]);

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

  it('POST /posts/:id/archive adds archived tag and DELETE removes it', async () => {
    const posts = [
      {
        id: 'p1',
        authorId: 'u1',
        type: 'free_speech',
        content: '',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
      },
    ];

    postsStoreMock.read.mockReturnValue(posts);
    usersStoreMock.read.mockReturnValue([]);

    let res = await request(app).post('/posts/p1/archive');

    expect(res.status).toBe(200);
    expect(posts[0].tags).toContain('archived');

    res = await request(app).delete('/posts/p1/archive');

    expect(res.status).toBe(200);
    expect(posts[0].tags).not.toContain('archived');
  });

  it('POST and DELETE /posts/:id/reactions/:type toggles reaction', async () => {
    reactionsStoreMock.read.mockReturnValue([]);
    const resAdd = await request(app).post('/posts/p1/reactions/like');
    expect(resAdd.status).toBe(200);
    expect(reactionsStoreMock.write).toHaveBeenCalledWith(['p1_u1_like']);

    reactionsStoreMock.read.mockReturnValue(['p1_u1_like']);
    const resDel = await request(app).delete('/posts/p1/reactions/like');
    expect(resDel.status).toBe(200);
    expect(reactionsStoreMock.write).toHaveBeenCalledWith([]);
  });

  it('POST /tasks/:id/request-help creates request and role posts', async () => {
    const task = {
      id: 't1',
      authorId: 'u1',
      type: 'task',
      content: 'task content',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [{ roles: ['dev'] }],
      linkedItems: [],
      questId: 'q1',
      helpRequest: false,
      needsHelp: false,
    } as any;

    const quest = {
      id: 'q1',
      authorId: 'u1',
      title: 'Quest',
      status: 'active',
      headPostId: '',
      linkedPosts: [],
      collaborators: [{ roles: ['design'] }],
    } as any;

    const store = [task];
    postsStoreMock.read.mockReturnValue(store);
    questsStoreMock.read.mockReturnValue([quest]);
    usersStoreMock.read.mockReturnValue([]);

    const res = await request(app).post('/posts/tasks/t1/request-help');

    expect(res.status).toBe(201);
    expect(res.body.subRequests).toHaveLength(2);
    expect(store).toHaveLength(4);
    expect(store[1].type).toBe('request');
    expect(store[2].replyTo).toBe(store[1].id);
    expect(store[1].boardId).toBe('quest-board');
    expect(store[2].boardId).toBe('quest-board');
  });

  it('POST /:id/request-help creates request post', async () => {
    const post = {
      id: 'p2',
      authorId: 'u1',
      type: 'issue',
      content: 'issue content',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
      questId: null,
      helpRequest: false,
      needsHelp: false,
    } as any;

    const store = [post];
    postsStoreMock.read.mockReturnValue(store);
    usersStoreMock.read.mockReturnValue([]);

    const res = await request(app).post('/posts/p2/request-help');

    expect(res.status).toBe(201);
    expect(res.body.request.type).toBe('request');
    expect(store).toHaveLength(2);
    expect(res.body.subRequests).toHaveLength(0);
    expect((store[1].linkedItems as any[])[0].itemId).toBe('p2');
    expect(store[0].helpRequest).toBe(true);
    expect(store[0].needsHelp).toBe(true);
    expect(store[1].boardId).toBe('quest-board');
  });

  it('rejects non-request posts on quest board', async () => {
    const res = await request(app)
      .post('/posts')
      .send({ type: 'free_speech', boardId: 'quest-board' });
    expect(res.status).toBe(400);
  });

  it('allows request post on quest board', async () => {
    postsStoreMock.read.mockReturnValue([]);
    postsStoreMock.write.mockClear();
    const res = await request(app)
      .post('/posts')
      .send({ type: 'request', boardId: 'quest-board' });
    expect(res.status).toBe(201);
    const written = postsStoreMock.write.mock.calls[0][0][0];
    expect(written.helpRequest).toBe(true);
    expect(written.boardId).toBe('quest-board');
  });

  it('rejects task post on quest board', async () => {
    postsStoreMock.read.mockReturnValue([]);
    const res = await request(app)
      .post('/posts')
      .send({ type: 'task', boardId: 'quest-board', helpRequest: true });
    expect(res.status).toBe(400);
  });

  it('rejects quest post on quest board', async () => {
    postsStoreMock.read.mockReturnValue([]);
    const res = await request(app)
      .post('/posts')
      .send({ type: 'quest', boardId: 'quest-board', helpRequest: true });
    expect(res.status).toBe(400);
  });

  it('deleting a quest head post removes the quest instead', async () => {
    const post = {
      id: 'p1',
      authorId: 'u1',
      type: 'log',
      content: '',
      visibility: 'public',
      timestamp: '',
      questId: 'q1',
    };
    const quest = {
      id: 'q1',
      authorId: 'u1',
      title: 'Quest',
      status: 'active',
      headPostId: 'p1',
      linkedPosts: [],
      collaborators: [],
      taskGraph: [] as any[],
    };

    postsStoreMock.read.mockReturnValue([post]);
    questsStoreMock.read.mockReturnValue([quest]);
    questsStoreMock.write.mockClear();

    const res = await request(app).delete('/posts/p1');

    expect(res.status).toBe(200);
    expect(questsStoreMock.write).toHaveBeenCalledWith([]);
    expect(postsStoreMock.write).not.toHaveBeenCalledWith([]); // post not removed
    expect(res.body.questDeleted).toBe('q1');
  });

  it('deleting a normal post removes only the post', async () => {
    const post = {
      id: 'p1',
      authorId: 'u1',
      type: 'log',
      content: '',
      visibility: 'public',
      timestamp: '',
    };

    postsStoreMock.read.mockReturnValue([post]);
    questsStoreMock.read.mockReturnValue([]);
    postsStoreMock.write.mockClear();

    const res = await request(app).delete('/posts/p1');

    expect(res.status).toBe(200);
    expect(postsStoreMock.write).toHaveBeenCalledWith([]);
    expect(res.body.questDeleted).toBeUndefined();
  });

  it('forbids editing system posts by regular users', async () => {
    const post = {
      id: 's1',
      authorId: 'u1',
      type: 'meta_system',
      content: 'sys',
      visibility: 'private',
      timestamp: '',
      systemGenerated: true,
    };
    postsStoreMock.read.mockReturnValue([post]);
    const res = await request(app).patch('/posts/s1').send({ content: 'new' });
    expect(res.status).toBe(403);
  });

  it('forbids fetching system posts by regular users', async () => {
    const post = {
      id: 's2',
      authorId: 'u1',
      type: 'meta_system',
      content: 'sys',
      visibility: 'private',
      timestamp: '',
    };
    postsStoreMock.read.mockReturnValue([post]);
    const res = await request(app).get('/posts/s2');
    expect(res.status).toBe(403);
  });
});
