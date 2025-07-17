"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const reviewRoutes_1 = __importDefault(require("../src/routes/reviewRoutes"));
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (_req, _res, next) => {
        _req.user = { id: 'u1' };
        next();
    },
}));
jest.mock('../src/models/stores', () => ({
    reviewsStore: { read: jest.fn(() => []), write: jest.fn() },
}));
const stores_1 = require("../src/models/stores");
const reviewsStoreMock = stores_1.reviewsStore;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/reviews', reviewRoutes_1.default);
describe('review routes', () => {
    it('POST /reviews creates review', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/reviews')
            .send({
            targetType: 'quest',
            rating: 5,
            feedback: 'great',
            visibility: 'public',
            status: 'submitted',
        });
        expect(res.status).toBe(201);
        expect(reviewsStoreMock.write).toHaveBeenCalled();
        expect(res.body.rating).toBe(5);
        expect(res.body.visibility).toBe('public');
    });
    it('GET /reviews filters by type and sorts', async () => {
        const data = [
            { id: 'r1', reviewerId: 'u1', targetType: 'quest', rating: 2, createdAt: '1' },
            { id: 'r2', reviewerId: 'u1', targetType: 'ai_app', rating: 5, createdAt: '2' },
        ];
        reviewsStoreMock.read.mockReturnValue(data);
        const res = await (0, supertest_1.default)(app).get('/reviews?type=quest&sort=highest');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe('r1');
    });
    it('POST /reviews rejects banned words', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/reviews')
            .send({ targetType: 'quest', rating: 4, feedback: 'badword inside' });
        expect(res.status).toBe(400);
    });
    it('GET /reviews/summary/:entityType/:id returns averages', async () => {
        const data = [
            { id: 'r1', reviewerId: 'u1', targetType: 'quest', rating: 4, tags: ['easy'], questId: 'q1', createdAt: '1' },
            { id: 'r2', reviewerId: 'u2', targetType: 'quest', rating: 2, tags: ['hard'], questId: 'q1', createdAt: '2' },
            { id: 'r3', reviewerId: 'u3', targetType: 'quest', rating: 5, tags: ['easy'], questId: 'q2', createdAt: '3' },
        ];
        reviewsStoreMock.read.mockReturnValue(data);
        const res = await (0, supertest_1.default)(app).get('/reviews/summary/quest/q1');
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(2);
        expect(res.body.averageRating).toBe(3);
        expect(res.body.tagCounts.easy).toBe(1);
    });
});
