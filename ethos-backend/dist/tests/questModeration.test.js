"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const questRoutes_1 = __importDefault(require("../src/routes/questRoutes"));
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (_req, _res, next) => { _req.user = { id: 'u1' }; next(); }
}));
jest.mock('../src/models/stores', () => ({
    questsStore: { read: jest.fn(() => []), write: jest.fn() },
    postsStore: { read: jest.fn(() => []), write: jest.fn() },
    boardsStore: { read: jest.fn(() => []), write: jest.fn() },
    usersStore: { read: jest.fn(() => [{ id: 'u1', role: 'moderator' }]), write: jest.fn() }
}));
const stores_1 = require("../src/models/stores");
const questsStoreMock = stores_1.questsStore;
const postsStoreMock = stores_1.postsStore;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/quests', questRoutes_1.default);
describe('quest moderation routes', () => {
    it('GET /quests/featured returns sorted quests', async () => {
        questsStoreMock.read.mockReturnValue([
            { id: 'q1', authorId: 'u1', title: 'A', headPostId: '', linkedPosts: [], collaborators: [], status: 'active', visibility: 'public', approvalStatus: 'approved', flagCount: 0 },
            { id: 'q2', authorId: 'u1', title: 'B', headPostId: '', linkedPosts: ['p1'], collaborators: [], status: 'active', visibility: 'public', approvalStatus: 'approved', flagCount: 0 }
        ]);
        postsStoreMock.read.mockReturnValue([{ id: 'p1', questId: 'q2', authorId: 'u1', type: 'task', content: '', visibility: 'public', timestamp: '' }]);
        const res = await (0, supertest_1.default)(app).get('/quests/featured');
        expect(res.status).toBe(200);
        expect(res.body[0].id).toBe('q2');
        expect(res.body).toHaveLength(2);
    });
    it('POST /quests/:id/flag increments flag count and creates review post', async () => {
        questsStoreMock.read.mockReturnValue([
            { id: 'q1', authorId: 'u1', title: 'A', headPostId: '', linkedPosts: [], collaborators: [], status: 'active', visibility: 'public', approvalStatus: 'approved', flagCount: 2 }
        ]);
        postsStoreMock.read.mockReturnValue([]);
        postsStoreMock.write.mockClear();
        const res = await (0, supertest_1.default)(app).post('/quests/q1/flag');
        expect(res.status).toBe(200);
        const updated = questsStoreMock.write.mock.calls[0][0][0];
        expect(updated.flagCount).toBe(3);
        expect(postsStoreMock.write).toHaveBeenCalled();
    });
});
