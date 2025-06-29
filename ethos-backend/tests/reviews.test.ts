import request from 'supertest';
import express from 'express';

import reviewRoutes from '../src/routes/reviewRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

jest.mock('../src/models/stores', () => ({
  reviewsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

import { reviewsStore } from '../src/models/stores';

const reviewsStoreMock = reviewsStore as jest.Mocked<any>;

const app = express();
app.use(express.json());
app.use('/reviews', reviewRoutes);

describe('review routes', () => {
  it('POST /reviews creates review', async () => {
    const res = await request(app)
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

    const res = await request(app).get('/reviews?type=quest&sort=highest');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('r1');
  });

  it('POST /reviews rejects banned words', async () => {
    const res = await request(app)
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

    const res = await request(app).get('/reviews/summary/quest/q1');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.averageRating).toBe(3);
    expect(res.body.tagCounts.easy).toBe(1);
  });
});
