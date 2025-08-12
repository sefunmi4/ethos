import request from 'supertest';
import express from 'express';

import gitRoutes from '../src/routes/gitRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

jest.mock('../src/models/stores', () => ({
  usersStore: { read: jest.fn(() => [{ id: 'u1', gitAccounts: [] }]), write: jest.fn() },
  gitStore: { read: jest.fn(() => []), write: jest.fn() },
}));

import { usersStore } from '../src/models/stores';

const app = express();
app.use(express.json());
app.use('/git', gitRoutes);

describe('git account routes', () => {
  it('saves hashed token', async () => {
    const res = await request(app)
      .post('/git/account')
      .send({ provider: 'github', username: 'alice', token: 'abc123' });
    expect(res.status).toBe(200);
    const written = (usersStore.write as jest.Mock).mock.calls[0][0];
    expect(written[0].gitAccounts[0].provider).toBe('github');
    expect(written[0].gitAccounts[0].username).toBe('alice');
    expect(written[0].gitAccounts[0].tokenHash).toBeDefined();
    expect(written[0].gitAccounts[0].tokenHash).not.toBe('abc123');
  });
});
