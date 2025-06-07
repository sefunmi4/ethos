import request from 'supertest';
import express from 'express';

import boardRoutes from '../src/routes/boardRoutes';
import questRoutes from '../src/routes/questRoutes';

jest.mock('../src/models/stores', () => ({
  boardsStore: {
    read: jest.fn(() => [
      { id: 'b1', title: 'Board', description: '', layout: 'grid', items: [] },
      { id: 'home', title: 'Home', description: '', layout: 'grid', items: [], defaultFor: 'home' },
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
      },
    ]),
    write: jest.fn(),
  },
  usersStore: { read: jest.fn(() => []), write: jest.fn() },
  reactionsStore: { read: jest.fn(() => []), write: jest.fn() },
}));

const app = express();
app.use(express.json());
app.use('/boards', boardRoutes);
app.use('/quests', questRoutes);

describe('route handlers', () => {
  it('GET /boards returns boards', async () => {
    const res = await request(app).get('/boards');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe('b1');
  });

  it('GET /quests returns quests', async () => {
    const res = await request(app).get('/quests');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('q1');
  });

  it('GET /boards/:id returns single board', async () => {
    const res = await request(app).get('/boards/b1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('b1');
  });

  it('GET /boards/default/home returns default board', async () => {
    const res = await request(app).get('/boards/default/home');
    expect(res.status).toBe(200);
    expect(res.body.defaultFor).toBe('home');
  });

  it('GET /quests/:id returns quest', async () => {
    const res = await request(app).get('/quests/q1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('q1');
  });
});
