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
}));
const stores_1 = require("../src/models/stores");
const questsStoreMock = stores_1.questsStore;
const postsStoreMock = stores_1.postsStore;
const boardsStoreMock = stores_1.boardsStore;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/quests', questRoutes_1.default);
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
        const res = await (0, supertest_1.default)(app).post('/quests').send({ title: 'my quest' });
        expect(res.status).toBe(400);
    });
});
