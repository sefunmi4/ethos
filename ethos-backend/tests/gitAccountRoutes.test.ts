import request from 'supertest';
import express from 'express';

import gitRoutes from '../src/routes/gitRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

let savedHash = '';
jest.mock('../src/db', () => ({
  pool: {
    query: jest.fn((sql: string, params: any[]) => {
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

const app = express();
app.use(express.json());
app.use('/git', gitRoutes);

describe('git account routes', () => {
  it('saves hashed token', async () => {
    const res = await request(app)
      .post('/git/account')
      .send({ provider: 'github', username: 'alice', token: 'abc123' });
    expect(res.status).toBe(200);
    expect(savedHash).toBeDefined();
    expect(savedHash).not.toBe('abc123');
  });
});
