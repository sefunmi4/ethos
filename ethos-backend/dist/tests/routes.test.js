"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const boardRoutes_1 = __importDefault(require("../src/routes/boardRoutes"));
const questRoutes_1 = __importDefault(require("../src/routes/questRoutes"));
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (_req, _res, next) => {
        _req.user = { id: 'u1' };
        next();
    },
}));
jest.mock('../src/models/stores', () => ({
    boardsStore: {
        read: jest.fn(() => [
            { id: 'b1', title: 'Board', boardType: 'post', description: '', layout: 'grid', items: [] },
            { id: 'home', title: 'Home', boardType: 'post', description: '', layout: 'grid', items: [], defaultFor: 'home' },
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
    boardLogsStore: { read: jest.fn(() => []), write: jest.fn() },
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/boards', boardRoutes_1.default);
app.use('/quests', questRoutes_1.default);
describe('route handlers', () => {
    it('GET /boards returns boards', async () => {
        const res = await (0, supertest_1.default)(app).get('/boards');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].id).toBe('b1');
    });
    it('GET /quests returns quests', async () => {
        const res = await (0, supertest_1.default)(app).get('/quests');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe('q1');
    });
    it('POST /quests creates quest with head post', async () => {
        const { postsStore, questsStore } = require('../src/models/stores');
        postsStore.read.mockReturnValue([]);
        questsStore.read.mockReturnValue([]);
        postsStore.write.mockClear();
        questsStore.write.mockClear();
        const res = await (0, supertest_1.default)(app)
            .post('/quests')
            .send({ title: 'New Quest', description: 'desc' });
        expect(res.status).toBe(201);
        const newPost = postsStore.write.mock.calls[0][0][0];
        const newQuest = questsStore.write.mock.calls[0][0][0];
        expect(newQuest.headPostId).toBe(newPost.id);
        expect(newPost.questId).toBe(newQuest.id);
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
    });
    it('GET /boards/:id returns single board', async () => {
        const res = await (0, supertest_1.default)(app).get('/boards/b1');
        expect(res.status).toBe(200);
        expect(res.body.id).toBe('b1');
    });
    it('GET /boards/default/home returns default board', async () => {
        const res = await (0, supertest_1.default)(app).get('/boards/default/home');
        expect(res.status).toBe(200);
        expect(res.body.defaultFor).toBe('home');
    });
    it('GET /quests/:id returns quest', async () => {
        const res = await (0, supertest_1.default)(app).get('/quests/q1');
        expect(res.status).toBe(200);
        expect(res.body.id).toBe('q1');
    });
    it('POST /quests/:id/collaborators adds open role', async () => {
        const res = await (0, supertest_1.default)(app)
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
        const res = await (0, supertest_1.default)(app).get('/quests/q1/map');
        expect(res.status).toBe(200);
        expect(res.body.nodes).toHaveLength(1);
        expect(res.body.edges).toHaveLength(1);
    });
    it('POST /quests/:id/link adds task edge with type and label', async () => {
        const { postsStore, questsStore } = require('../src/models/stores');
        const quest = {
            id: 'q1',
            authorId: 'u1',
            title: 'Quest',
            status: 'active',
            headPostId: 'h1',
            linkedPosts: [],
            collaborators: [],
            taskGraph: [],
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
        const res = await (0, supertest_1.default)(app)
            .post('/quests/q1/link')
            .send({ postId: 't1', edgeType: 'sub_problem', edgeLabel: 'relates', title: 'Task t1' });
        expect(res.status).toBe(200);
        expect(quest.taskGraph).toHaveLength(1);
        expect(quest.taskGraph[0]).toEqual({
            from: 'h1',
            to: 't1',
            type: 'sub_problem',
            label: 'relates',
        });
        expect(quest.linkedPosts[0].title).toBe('Task t1');
    });
    it('POST /quests/:id/link links task to task when parentId provided', async () => {
        const { postsStore, questsStore } = require('../src/models/stores');
        const quest = {
            id: 'q1',
            authorId: 'u1',
            title: 'Quest',
            status: 'active',
            headPostId: 'h1',
            linkedPosts: [],
            collaborators: [],
            taskGraph: [],
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
        const res = await (0, supertest_1.default)(app)
            .post('/quests/q1/link')
            .send({ postId: 't2', parentId: 't1', title: 'Task t2' });
        expect(res.status).toBe(200);
        expect(quest.taskGraph).toHaveLength(1);
        expect(quest.taskGraph[0]).toEqual({ from: 't1', to: 't2', type: undefined, label: undefined });
        expect(quest.linkedPosts[0].title).toBe('Task t2');
    });
    it('POST /quests/:id/complete cascades solution', async () => {
        const { questsStore, postsStore } = require('../src/models/stores');
        const quest = {
            id: 'q1',
            authorId: 'u1',
            title: 'Quest',
            status: 'active',
            headPostId: '',
            linkedPosts: [
                { itemId: 'p1', itemType: 'post', cascadeSolution: true },
                { itemId: 'qParent', itemType: 'quest', cascadeSolution: true },
            ],
            collaborators: [],
            taskGraph: [],
        };
        const parent = {
            id: 'qParent',
            authorId: 'u1',
            title: 'Parent',
            status: 'active',
            headPostId: '',
            linkedPosts: [],
            collaborators: [],
            taskGraph: [],
        };
        questsStore.read.mockReturnValue([quest, parent]);
        postsStore.read.mockReturnValue([
            {
                id: 'p1',
                authorId: 'u1',
                type: 'task',
                content: '',
                visibility: 'public',
                timestamp: '',
                tags: [],
            },
        ]);
        postsStore.write.mockClear();
        const res = await (0, supertest_1.default)(app).post('/quests/q1/complete');
        expect(res.status).toBe(200);
        expect(quest.status).toBe('completed');
        expect(parent.status).toBe('completed');
        expect(postsStore.write).toHaveBeenCalled();
    });
    it('GET /boards/:id/quests returns quests from board', async () => {
        const { boardsStore, questsStore } = require('../src/models/stores');
        boardsStore.read.mockReturnValue([
            { id: 'b1', title: 'Board', boardType: 'post', description: '', layout: 'grid', items: ['q1'] },
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
        const res = await (0, supertest_1.default)(app).get('/boards/b1/quests');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe('q1');
    });
    it('GET /boards/:id/quests?enrich=true returns enriched quests', async () => {
        const { boardsStore, questsStore, usersStore } = require('../src/models/stores');
        boardsStore.read.mockReturnValue([
            { id: 'b1', title: 'Board', boardType: 'post', description: '', layout: 'grid', items: ['q1'] },
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
        const res = await (0, supertest_1.default)(app).get('/boards/b1/quests?enrich=true');
        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('logs');
    });
    it('PATCH /boards/:id creates board when not found', async () => {
        const { boardsStore } = require('../src/models/stores');
        const store = [];
        boardsStore.read.mockReturnValue(store);
        const res = await (0, supertest_1.default)(app)
            .patch('/boards/new-board')
            .send({ title: 'New Board', items: ['i1'] });
        expect(res.status).toBe(201);
        expect(res.body.id).toBe('new-board');
        expect(store).toHaveLength(1);
        expect(store[0].items).toContain('i1');
    });
    it('POST /boards logs creation', async () => {
        const { boardsStore, boardLogsStore } = require('../src/models/stores');
        boardsStore.read.mockReturnValue([]);
        boardLogsStore.read.mockReturnValue([]);
        boardLogsStore.write.mockClear();
        await (0, supertest_1.default)(app)
            .post('/boards')
            .send({ title: 'Board', items: [], layout: 'grid', boardType: 'post' });
        expect(boardLogsStore.write).toHaveBeenCalled();
        const log = boardLogsStore.write.mock.calls[0][0][0];
        expect(log.action).toBe('create');
    });
    it('PATCH /boards/:id logs update', async () => {
        const { boardsStore, boardLogsStore } = require('../src/models/stores');
        boardsStore.read.mockReturnValue([{ id: 'b1', title: 'B', boardType: 'post', layout: 'grid', items: [] }]);
        boardLogsStore.read.mockReturnValue([]);
        boardLogsStore.write.mockClear();
        await (0, supertest_1.default)(app).patch('/boards/b1').send({ title: 'New' });
        expect(boardLogsStore.write).toHaveBeenCalled();
        const log = boardLogsStore.write.mock.calls[0][0][0];
        expect(log.action).toBe('update');
    });
    it('DELETE /boards/:id logs deletion', async () => {
        const { boardsStore, boardLogsStore } = require('../src/models/stores');
        boardsStore.read.mockReturnValue([{ id: 'b1', title: 'B', boardType: 'post', layout: 'grid', items: [] }]);
        boardLogsStore.read.mockReturnValue([]);
        boardLogsStore.write.mockClear();
        await (0, supertest_1.default)(app).delete('/boards/b1');
        expect(boardLogsStore.write).toHaveBeenCalled();
        const log = boardLogsStore.write.mock.calls[0][0][0];
        expect(log.action).toBe('delete');
    });
    it('GET /boards/thread/:postId paginates replies', async () => {
        const { postsStore } = require('../src/models/stores');
        postsStore.read.mockReturnValue([
            {
                id: 'r1',
                authorId: 'u1',
                type: 'free_speech',
                content: '',
                visibility: 'public',
                timestamp: '',
                replyTo: 'p1',
                tags: [],
                collaborators: [],
                linkedItems: [],
            },
            {
                id: 'r2',
                authorId: 'u1',
                type: 'free_speech',
                content: '',
                visibility: 'public',
                timestamp: '',
                replyTo: 'p1',
                tags: [],
                collaborators: [],
                linkedItems: [],
            },
            {
                id: 'r3',
                authorId: 'u1',
                type: 'free_speech',
                content: '',
                visibility: 'public',
                timestamp: '',
                replyTo: 'p1',
                tags: [],
                collaborators: [],
                linkedItems: [],
            },
        ]);
        const res1 = await (0, supertest_1.default)(app).get('/boards/thread/p1?page=1&limit=2');
        expect(res1.status).toBe(200);
        expect(res1.body.items).toEqual(['r1', 'r2']);
        const res2 = await (0, supertest_1.default)(app).get('/boards/thread/p1?page=2&limit=2');
        expect(res2.status).toBe(200);
        expect(res2.body.items).toEqual(['r3']);
    });
});
