"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const postRoutes_1 = __importDefault(require("../src/routes/postRoutes"));
const boardRoutes_1 = __importDefault(require("../src/routes/boardRoutes"));
const db = __importStar(require("../src/db"));
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (_req, _res, next) => {
        _req.user = { id: 'u1' };
        next();
    },
}));
db.usePg = true;
const rows = {
    posts: [],
    boards: [
        { id: 'quest-board', title: 'Quest Board', boardtype: 'post', layout: 'grid', items: [], featured: false },
    ],
    quests: [],
};
db.pool.query = jest.fn(async (text, params) => {
    if (text.startsWith('INSERT INTO posts')) {
        const [id, authorid, type, content, title, visibility, tags, boardid, timestamp] = params;
        rows.posts.push({ id, authorid, type, content, title, visibility, tags, boardid, timestamp, createdat: timestamp });
        return { rows: [] };
    }
    if (text.startsWith('UPDATE boards')) {
        return { rows: [] };
    }
    if (text.startsWith('SELECT * FROM boards')) {
        return { rows: rows.boards };
    }
    if (text.startsWith('SELECT * FROM posts')) {
        return { rows: rows.posts };
    }
    if (text.startsWith('SELECT * FROM quests')) {
        return { rows: rows.quests };
    }
    return { rows: [] };
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/posts', postRoutes_1.default);
app.use('/boards', boardRoutes_1.default);
describe('postgres persistence', () => {
    it('shows request posts on quest board after refresh', async () => {
        const postRes = await (0, supertest_1.default)(app)
            .post('/posts')
            .send({ type: 'request', content: 'Need help', visibility: 'public' });
        expect(postRes.status).toBe(201);
        const postId = postRes.body.id;
        const boardRes = await (0, supertest_1.default)(app).get('/boards');
        expect(boardRes.status).toBe(200);
        const questBoard = boardRes.body.find((b) => b.id === 'quest-board');
        expect(questBoard.items).toContain(postId);
    });
});
