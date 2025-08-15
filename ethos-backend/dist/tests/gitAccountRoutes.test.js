"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const gitRoutes_1 = __importDefault(require("../src/routes/gitRoutes"));
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (_req, _res, next) => {
        _req.user = { id: 'u1' };
        next();
    },
}));
let savedHash = '';
jest.mock('../src/db', () => ({
    pool: {
        query: jest.fn((sql, params) => {
            if (sql.startsWith('SELECT id FROM users')) {
                return Promise.resolve({ rowCount: 1, rows: [{ id: 'u1' }] });
            }
            if (sql.startsWith('INSERT INTO git_accounts')) {
                savedHash = params[3];
                return Promise.resolve({ rowCount: 1 });
            }
            if (sql.startsWith('SELECT provider')) {
                return Promise.resolve({ rows: [{ provider: 'github', username: 'alice', tokenHash: savedHash, linkedRepoIds: [] }] });
            }
            return Promise.resolve({ rows: [] });
        })
    },
    usePg: true,
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/git', gitRoutes_1.default);
describe('git account routes', () => {
    it('saves hashed token', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/git/account')
            .send({ provider: 'github', username: 'alice', token: 'abc123' });
        expect(res.status).toBe(200);
        expect(savedHash).toBeDefined();
        expect(savedHash).not.toBe('abc123');
    });
});
