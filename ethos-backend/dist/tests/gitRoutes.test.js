"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const simple_git_1 = __importDefault(require("simple-git"));
const gitRoutes_1 = __importDefault(require("../src/routes/gitRoutes"));
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (_req, _res, next) => {
        _req.user = { id: 'u1' };
        next();
    },
}));
const gitData = [];
jest.mock('../src/models/stores', () => ({
    gitStore: {
        read: jest.fn(() => gitData),
        write: jest.fn((d) => {
            gitData.splice(0, gitData.length, ...d);
        }),
    },
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/git', gitRoutes_1.default);
const baseRepo = path_1.default.join(__dirname, 'tmpRepo');
const reposRoot = path_1.default.join(__dirname, '../src/repos');
let commitSha = '';
beforeAll(async () => {
    fs_1.default.mkdirSync(baseRepo, { recursive: true });
    const git = (0, simple_git_1.default)(baseRepo);
    await git.init();
    await git.checkoutLocalBranch('main');
    fs_1.default.writeFileSync(path_1.default.join(baseRepo, 'file.txt'), 'hello');
    await git.add('.');
    await git.commit('initial');
    commitSha = (await git.revparse(['HEAD'])).trim();
    fs_1.default.mkdirSync(reposRoot, { recursive: true });
});
afterAll(() => {
    fs_1.default.rmSync(baseRepo, { recursive: true, force: true });
    fs_1.default.rmSync(reposRoot, { recursive: true, force: true });
});
describe('git routes real operations', () => {
    it('connects to repo and exposes info', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/git/connect')
            .send({ questId: 'q1', repoUrl: baseRepo, branch: 'main' });
        expect(res.status).toBe(200);
        expect(res.body.repoUrl).toBe(baseRepo);
        const status = await (0, supertest_1.default)(app).get('/git/status/q1');
        expect(status.status).toBe(200);
        expect(status.body.status.branch).toBe('main');
    });
    it('returns files and commits', async () => {
        await (0, supertest_1.default)(app)
            .post('/git/connect')
            .send({ questId: 'q2', repoUrl: baseRepo, branch: 'main' });
        const files = await (0, supertest_1.default)(app).get('/git/files/q2');
        expect(files.status).toBe(200);
        expect(files.body.files).toContain('file.txt');
        const commits = await (0, supertest_1.default)(app).get('/git/commits/q2');
        expect(commits.status).toBe(200);
        expect(commits.body[0].id).toBe(commitSha);
    });
    it('returns diff for commit', async () => {
        await (0, supertest_1.default)(app)
            .post('/git/connect')
            .send({ questId: 'q3', repoUrl: baseRepo, branch: 'main' });
        const diff = await (0, supertest_1.default)(app).get(`/git/diff/q3?commitId=${commitSha}`);
        expect(diff.status).toBe(200);
        expect(diff.body.diffMarkdown).toContain('file.txt');
    });
});
