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
const stores_1 = require("../src/models/stores");
const boardsStoreMock = stores_1.boardsStore;
const postsStoreMock = stores_1.postsStore;
const questsStoreMock = stores_1.questsStore;
const usersStoreMock = stores_1.usersStore;
const reactionsStoreMock = stores_1.reactionsStore;
const boardLogsStoreMock = stores_1.boardLogsStore;
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
        postsStoreMock.read.mockReturnValue([]);
        questsStoreMock.read.mockReturnValue([]);
        postsStoreMock.write.mockClear();
        questsStoreMock.write.mockClear();
        const res = await (0, supertest_1.default)(app)
            .post('/quests')
            .send({ title: 'New Quest', description: 'desc' });
        expect(res.status).toBe(201);
        const newPost = postsStoreMock.write.mock.calls[0][0][0];
        const newQuest = questsStoreMock.write.mock.calls[0][0][0];
        expect(newQuest.headPostId).toBe(newPost.id);
        expect(newPost.questId).toBe(newQuest.id);
        questsStoreMock.read.mockReturnValue([
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
        postsStoreMock.read.mockReturnValue([
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
        questsStoreMock.read.mockReturnValue([
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
        questsStoreMock.read.mockReturnValue([quest]);
        postsStoreMock.read.mockReturnValue([
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
        questsStoreMock.read.mockReturnValue([quest]);
        postsStoreMock.read.mockReturnValue([
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
        questsStoreMock.read.mockReturnValue([quest, parent]);
        postsStoreMock.read.mockReturnValue([
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
        postsStoreMock.write.mockClear();
        const res = await (0, supertest_1.default)(app).post('/quests/q1/complete');
        expect(res.status).toBe(200);
        expect(quest.status).toBe('completed');
        expect(parent.status).toBe('completed');
        expect(postsStoreMock.write).toHaveBeenCalled();
    });
    it('GET /boards/:id/quests returns quests from board', async () => {
        boardsStoreMock.read.mockReturnValue([
            { id: 'b1', title: 'Board', boardType: 'post', description: '', layout: 'grid', items: ['q1'] },
        ]);
        questsStoreMock.read.mockReturnValue([
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
        boardsStoreMock.read.mockReturnValue([
            { id: 'b1', title: 'Board', boardType: 'post', description: '', layout: 'grid', items: ['q1'] },
        ]);
        questsStoreMock.read.mockReturnValue([
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
        usersStoreMock.read.mockReturnValue([{ id: 'u1', username: 'test', role: 'user' }]);
        const res = await (0, supertest_1.default)(app).get('/boards/b1/quests?enrich=true');
        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('logs');
    });
    it('PATCH /boards/:id creates board when not found', async () => {
        const store = [];
        boardsStoreMock.read.mockReturnValue(store);
        const res = await (0, supertest_1.default)(app)
            .patch('/boards/new-board')
            .send({ title: 'New Board', items: ['i1'] });
        expect(res.status).toBe(201);
        expect(res.body.id).toBe('new-board');
        expect(store).toHaveLength(1);
        expect(store[0].items).toContain('i1');
    });
    it('POST /boards logs creation', async () => {
        boardsStoreMock.read.mockReturnValue([]);
        boardLogsStoreMock.read.mockReturnValue([]);
        boardLogsStoreMock.write.mockClear();
        await (0, supertest_1.default)(app)
            .post('/boards')
            .send({ title: 'Board', items: [], layout: 'grid', boardType: 'post' });
        expect(boardLogsStoreMock.write).toHaveBeenCalled();
        const log = boardLogsStoreMock.write.mock.calls[0][0][0];
        expect(log.action).toBe('create');
    });
    it('PATCH /boards/:id logs update', async () => {
        boardsStoreMock.read.mockReturnValue([{ id: 'b1', title: 'B', boardType: 'post', layout: 'grid', items: [] }]);
        boardLogsStoreMock.read.mockReturnValue([]);
        boardLogsStoreMock.write.mockClear();
        await (0, supertest_1.default)(app).patch('/boards/b1').send({ title: 'New' });
        expect(boardLogsStoreMock.write).toHaveBeenCalled();
        const log = boardLogsStoreMock.write.mock.calls[0][0][0];
        expect(log.action).toBe('update');
    });
    it('DELETE /boards/:id logs deletion', async () => {
        boardsStoreMock.read.mockReturnValue([{ id: 'b1', title: 'B', boardType: 'post', layout: 'grid', items: [] }]);
        boardLogsStoreMock.read.mockReturnValue([]);
        boardLogsStoreMock.write.mockClear();
        await (0, supertest_1.default)(app).delete('/boards/b1');
        expect(boardLogsStoreMock.write).toHaveBeenCalled();
        const log = boardLogsStoreMock.write.mock.calls[0][0][0];
        expect(log.action).toBe('delete');
    });
    it('GET /boards/thread/:postId paginates replies', async () => {
        postsStoreMock.read.mockReturnValue([
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
    it('GET /boards/quest-board/items excludes archived requests', async () => {
        boardsStoreMock.read.mockReturnValue([
            { id: 'quest-board', title: 'QB', boardType: 'post', description: '', layout: 'grid', items: [] }
        ]);
        postsStoreMock.read.mockReturnValue([
            { id: 'req1', authorId: 'u1', type: 'request', content: '', visibility: 'public', timestamp: '', tags: ['archived'], collaborators: [], linkedItems: [] },
            { id: 'req2', authorId: 'u1', type: 'request', content: '', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
        ]);
        const res = await (0, supertest_1.default)(app).get('/boards/quest-board/items');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe('req2');
    });
});
