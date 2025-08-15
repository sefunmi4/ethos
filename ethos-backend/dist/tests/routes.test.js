"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
jest.mock('../src/db', () => ({
    pool: { query: jest.fn() },
    usePg: true,
}));
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (_req, _res, next) => {
        _req.user = { id: 'u1' };
        next();
    },
}));
jest.mock('../src/models/stores', () => ({
    postsStore: { read: jest.fn(() => []), write: jest.fn() },
    usersStore: { read: jest.fn(() => [{ id: 'u1', username: 'user1' }]), write: jest.fn() },
    reactionsStore: { read: jest.fn(() => []), write: jest.fn() },
    questsStore: { read: jest.fn(() => []), write: jest.fn() },
}));
const postRoutes_1 = __importDefault(require("../src/routes/postRoutes"));
const db_1 = require("../src/db");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/posts', postRoutes_1.default);
describe('Postgres routes', () => {
    it('GET /posts/:id returns enriched post with tags array', async () => {
        const now = new Date();
        db_1.pool.query.mockResolvedValue({
            rows: [
                {
                    id: 'p1',
                    authorid: 'u1',
                    type: 'free_speech',
                    content: 'hello',
                    title: '',
                    visibility: 'public',
                    tags: '{"alpha","beta"}',
                    boardid: null,
                    timestamp: now,
                    createdat: now,
                },
            ],
        });
        const res = await (0, supertest_1.default)(app).get('/posts/p1');
        expect(res.status).toBe(200);
        expect(res.body.enriched).toBe(true);
        expect(res.body.tags).toEqual(['alpha', 'beta']);
    });
    it('POST and DELETE /posts/:id/reactions/:type modify reactions', async () => {
        db_1.pool.query.mockResolvedValueOnce({ rows: [] });
        const resAdd = await (0, supertest_1.default)(app).post('/posts/p1/reactions/like');
        expect(resAdd.status).toBe(200);
        expect(db_1.pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO reactions'), expect.any(Array));
        db_1.pool.query.mockResolvedValueOnce({ rows: [] });
        const resDel = await (0, supertest_1.default)(app).delete('/posts/p1/reactions/like');
        expect(resDel.status).toBe(200);
        expect(db_1.pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM reactions'), ['p1', 'u1', 'like']);
    });
    it('GET /posts/:id/reactions retrieves reactions', async () => {
        db_1.pool.query.mockResolvedValueOnce({
            rows: [{ userId: 'u1', type: 'like' }],
        });
        const res = await (0, supertest_1.default)(app).get('/posts/p1/reactions');
        expect(res.status).toBe(200);
        expect(db_1.pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT userid AS "userId", type FROM reactions'), ['p1']);
        expect(res.body).toEqual([{ userId: 'u1', type: 'like' }]);
    });
});
