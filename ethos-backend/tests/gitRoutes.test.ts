import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';

import gitRoutes from '../src/routes/gitRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1' };
    next();
  },
}));

const gitData: any[] = [];
jest.mock('../src/models/stores', () => ({
  gitStore: {
    read: jest.fn(() => gitData),
    write: jest.fn((d: any) => {
      gitData.splice(0, gitData.length, ...d);
    }),
  },
}));

const app = express();
app.use(express.json());
app.use('/git', gitRoutes);

const baseRepo = path.join(__dirname, 'tmpRepo');
const reposRoot = path.join(__dirname, '../src/repos');
let commitSha = '';

beforeAll(async () => {
  fs.mkdirSync(baseRepo, { recursive: true });
  const git = simpleGit(baseRepo);
  await git.init();
  await git.checkoutLocalBranch('main');
  fs.writeFileSync(path.join(baseRepo, 'file.txt'), 'hello');
  await git.add('.');
  await git.commit('initial');
  commitSha = (await git.revparse(['HEAD'])).trim();
  fs.mkdirSync(reposRoot, { recursive: true });
});

afterAll(() => {
  fs.rmSync(baseRepo, { recursive: true, force: true });
  fs.rmSync(reposRoot, { recursive: true, force: true });
});

describe('git routes real operations', () => {
  it('connects to repo and exposes info', async () => {
    const res = await request(app)
      .post('/git/connect')
      .send({ questId: 'q1', repoUrl: baseRepo, branch: 'main' });
    expect(res.status).toBe(200);
    expect(res.body.repoUrl).toBe(baseRepo);

    const status = await request(app).get('/git/status/q1');
    expect(status.status).toBe(200);
    expect(status.body.status.branch).toBe('main');
  });

  it('returns files and commits', async () => {
    await request(app)
      .post('/git/connect')
      .send({ questId: 'q2', repoUrl: baseRepo, branch: 'main' });

    const files = await request(app).get('/git/files/q2');
    expect(files.status).toBe(200);
    expect(files.body.files).toContain('file.txt');

    const commits = await request(app).get('/git/commits/q2');
    expect(commits.status).toBe(200);
    expect(commits.body[0].id).toBe(commitSha);
  });

  it('returns diff for commit', async () => {
    await request(app)
      .post('/git/connect')
      .send({ questId: 'q3', repoUrl: baseRepo, branch: 'main' });

    const diff = await request(app).get(`/git/diff/q3?commitId=${commitSha}`);
    expect(diff.status).toBe(200);
    expect(diff.body.diffMarkdown).toContain('file.txt');
  });
});
