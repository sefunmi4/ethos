"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const postRoutes_1 = __importDefault(require("../src/routes/postRoutes"));
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (_req, _res, next) => {
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
const { postsStore, questsStore, usersStore, reactionsStore } = require('../src/models/stores');
const { generateNodeId } = require('../src/utils/nodeIdUtils');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/posts', postRoutes_1.default);
describe('post routes', () => {
    it('POST /posts creates a post', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/posts')
            .send({ type: 'free_speech', content: 'hello', visibility: 'public' });
        expect(res.status).toBe(201);
        expect(res.body.content).toBe('hello');
    });
    it("POST /posts defaults task status to 'To Do'", async () => {
        postsStore.read.mockReturnValue([]);
        postsStore.write.mockClear();
        const res = await (0, supertest_1.default)(app).post('/posts').send({ type: 'task' });
        expect(res.status).toBe(201);
        const written = postsStore.write.mock.calls[0][0][0];
        expect(written.status).toBe('To Do');
        expect(res.body.status).toBe('To Do');
    });
    it('POST /posts uses provided task status', async () => {
        postsStore.read.mockReturnValue([]);
        postsStore.write.mockClear();
        const res = await (0, supertest_1.default)(app)
            .post('/posts')
            .send({ type: 'task', status: 'Blocked' });
        expect(res.status).toBe(201);
        const written = postsStore.write.mock.calls[0][0][0];
        expect(written.status).toBe('Blocked');
        expect(res.body.status).toBe('Blocked');
    });
    it('POST /posts links task to quest taskGraph', async () => {
        const quest = {
            id: 'q1',
            title: 'Quest',
            status: 'active',
            headPostId: '',
            linkedPosts: [],
            collaborators: [],
            taskGraph: [],
        };
        postsStore.read.mockReturnValue([]);
        questsStore.read.mockReturnValue([quest]);
        postsStore.write.mockClear();
        questsStore.write.mockClear();
        const res = await (0, supertest_1.default)(app).post('/posts').send({ type: 'task', questId: 'q1' });
        expect(res.status).toBe(201);
        const newPost = postsStore.write.mock.calls[0][0][0];
        expect(quest.taskGraph).toHaveLength(1);
        expect(quest.taskGraph[0]).toEqual({ from: '', to: newPost.id });
        expect(questsStore.write).toHaveBeenCalled();
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
        postsStore.read.mockReturnValue(posts);
        questsStore.read.mockReturnValue([
            { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
            { id: 'q2', title: 'Second Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
        ]);
        usersStore.read.mockReturnValue([]);
        const res = await (0, supertest_1.default)(app).patch('/posts/p1').send({ questId: 'q2' });
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
        postsStore.read.mockReturnValue(posts);
        questsStore.read.mockReturnValue([
            { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
            { id: 'q2', title: 'Second Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
        ]);
        usersStore.read.mockReturnValue([]);
        const res = await (0, supertest_1.default)(app).patch('/posts/t1').send({ questId: 'q2' });
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
        postsStore.read.mockReturnValue(posts);
        questsStore.read.mockReturnValue([
            { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
        ]);
        usersStore.read.mockReturnValue([]);
        const res = await (0, supertest_1.default)(app).patch('/posts/l1').send({ replyTo: 'p2' });
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
        postsStore.read.mockReturnValue(posts);
        questsStore.read.mockReturnValue([
            { id: 'q1', title: 'First Quest', status: 'active', headPostId: '', linkedPosts: [], collaborators: [] },
        ]);
        usersStore.read.mockReturnValue([]);
        const res = await (0, supertest_1.default)(app).patch('/posts/t1').send({ type: 'issue' });
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
    it('POST /posts/:id/archive adds archived tag', async () => {
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
        postsStore.read.mockReturnValue(posts);
        usersStore.read.mockReturnValue([]);
        const res = await (0, supertest_1.default)(app).post('/posts/p1/archive');
        expect(res.status).toBe(200);
        expect(posts[0].tags).toContain('archived');
    });
    it('POST and DELETE /posts/:id/reactions/:type toggles reaction', async () => {
        reactionsStore.read.mockReturnValue([]);
        const resAdd = await (0, supertest_1.default)(app).post('/posts/p1/reactions/like');
        expect(resAdd.status).toBe(200);
        expect(reactionsStore.write).toHaveBeenCalledWith(['p1_u1_like']);
        reactionsStore.read.mockReturnValue(['p1_u1_like']);
        const resDel = await (0, supertest_1.default)(app).delete('/posts/p1/reactions/like');
        expect(resDel.status).toBe(200);
        expect(reactionsStore.write).toHaveBeenCalledWith([]);
    });
    it('POST /tasks/:id/request-help creates request post', async () => {
        const task = {
            id: 't1',
            authorId: 'u1',
            type: 'task',
            content: 'task content',
            visibility: 'public',
            timestamp: '',
            tags: [],
            collaborators: [],
            linkedItems: [],
            questId: null,
        };
        const store = [task];
        postsStore.read.mockReturnValue(store);
        usersStore.read.mockReturnValue([]);
        const res = await (0, supertest_1.default)(app).post('/posts/tasks/t1/request-help');
        expect(res.status).toBe(201);
        expect(store).toHaveLength(2);
        expect(store[1].type).toBe('request');
        expect(store[1].linkedItems[0].itemId).toBe('t1');
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
        };
        const store = [post];
        postsStore.read.mockReturnValue(store);
        usersStore.read.mockReturnValue([]);
        const res = await (0, supertest_1.default)(app).post('/posts/p2/request-help');
        expect(res.status).toBe(201);
        expect(store).toHaveLength(2);
        expect(store[1].type).toBe('request');
        expect(store[1].linkedItems[0].itemId).toBe('p2');
    });
    it('rejects non-request posts on quest board', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/posts')
            .send({ type: 'free_speech', boardId: 'quest-board' });
        expect(res.status).toBe(400);
    });
    it('allows request post on quest board', async () => {
        postsStore.read.mockReturnValue([]);
        postsStore.write.mockClear();
        const res = await (0, supertest_1.default)(app)
            .post('/posts')
            .send({ type: 'request', boardId: 'quest-board' });
        expect(res.status).toBe(201);
        const written = postsStore.write.mock.calls[0][0][0];
        expect(written.helpRequest).toBe(true);
    });
    it('rejects task post on quest board', async () => {
        postsStore.read.mockReturnValue([]);
        const res = await (0, supertest_1.default)(app)
            .post('/posts')
            .send({ type: 'task', boardId: 'quest-board', helpRequest: true });
        expect(res.status).toBe(400);
    });
    it('rejects quest post on quest board', async () => {
        postsStore.read.mockReturnValue([]);
        const res = await (0, supertest_1.default)(app)
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
            taskGraph: [],
        };
        postsStore.read.mockReturnValue([post]);
        questsStore.read.mockReturnValue([quest]);
        questsStore.write.mockClear();
        const res = await (0, supertest_1.default)(app).delete('/posts/p1');
        expect(res.status).toBe(200);
        expect(questsStore.write).toHaveBeenCalledWith([]);
        expect(postsStore.write).not.toHaveBeenCalledWith([]); // post not removed
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
        postsStore.read.mockReturnValue([post]);
        questsStore.read.mockReturnValue([]);
        postsStore.write.mockClear();
        const res = await (0, supertest_1.default)(app).delete('/posts/p1');
        expect(res.status).toBe(200);
        expect(postsStore.write).toHaveBeenCalledWith([]);
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
        postsStore.read.mockReturnValue([post]);
        const res = await (0, supertest_1.default)(app).patch('/posts/s1').send({ content: 'new' });
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
        postsStore.read.mockReturnValue([post]);
        const res = await (0, supertest_1.default)(app).get('/posts/s2');
        expect(res.status).toBe(403);
    });
});
