import request from 'supertest';
import express from 'express';
import postRoutes from '../src/routes/postRoutes';
import boardRoutes from '../src/routes/boardRoutes';
import * as db from '../src/db';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

(db as any).usePg = true;
const rows: any = {
  posts: [] as any[],
  boards: [
    { id: 'quest-board', title: 'Quest Board', boardtype: 'post', layout: 'grid', items: [], featured: false },
  ],
  quests: [] as any[],
};

(db.pool as any).query = jest.fn(async (text: string, params?: any[]) => {
  if (text.startsWith('INSERT INTO posts')) {
    const [id, authorid, type, content, title, visibility, tags, boardid, timestamp] = params!;
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

const app = express();
app.use(express.json());
app.use('/posts', postRoutes);
app.use('/boards', boardRoutes);

describe('postgres persistence', () => {
  it('shows request posts on quest board after refresh', async () => {
    const postRes = await request(app)
      .post('/posts')
      .send({ type: 'request', subtype: 'task', content: 'Need help', visibility: 'public' });
    expect(postRes.status).toBe(201);
    const postId = postRes.body.id;

    const boardRes = await request(app).get('/boards');
    expect(boardRes.status).toBe(200);
    const questBoard = boardRes.body.find((b: any) => b.id === 'quest-board');
    expect(questBoard.items).toContain(postId);
  });
});
