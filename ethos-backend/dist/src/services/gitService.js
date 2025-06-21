"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRepo = initRepo;
exports.createFolder = createFolder;
exports.createFile = createFile;
exports.updateFile = updateFile;
exports.downloadRepo = downloadRepo;
exports.getQuestRepoMeta = getQuestRepoMeta;
exports.connectRepo = connectRepo;
exports.syncRepo = syncRepo;
exports.removeRepo = removeRepo;
exports.archiveHistory = archiveHistory;
exports.getDiff = getDiff;
exports.getFileTree = getFileTree;
exports.getCommits = getCommits;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const archiver_1 = __importDefault(require("archiver"));
const simple_git_1 = __importDefault(require("simple-git"));
const stores_1 = require("../models/stores");
const reposRoot = path_1.default.join(__dirname, '../repos');
function ensureRepoDir(questId) {
    const dir = path_1.default.join(reposRoot, questId);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
async function initRepo(questId, name) {
    const repoDir = ensureRepoDir(questId);
    const repos = stores_1.gitStore.read();
    const existing = repos.find((r) => r.id === questId);
    const repo = existing ?? {
        id: questId,
        repoUrl: '',
        defaultBranch: 'main',
        branches: ['main'],
        lastCommitSha: '',
        status: {},
        fileTree: [],
        commits: [],
    };
    if (!existing) {
        repos.push(repo);
        stores_1.gitStore.write(repos);
    }
    return repo;
}
function findNode(tree, parts) {
    if (parts.length === 0)
        return null;
    const [head, ...rest] = parts;
    const node = tree.find((n) => n.name === head);
    if (!node)
        return null;
    if (rest.length === 0)
        return node;
    if (!node.children)
        return null;
    return findNode(node.children, rest);
}
async function createFolder(questId, folderPath) {
    const repoDir = ensureRepoDir(questId);
    const target = path_1.default.join(repoDir, folderPath);
    fs_1.default.mkdirSync(target, { recursive: true });
    const repos = stores_1.gitStore.read();
    const repo = repos.find((r) => r.id === questId);
    if (repo) {
        const parts = folderPath.split('/').filter(Boolean);
        let current = repo.fileTree;
        for (const part of parts) {
            let node = current.find((n) => n.name === part);
            if (!node) {
                node = {
                    id: (0, uuid_1.v4)(),
                    path: part,
                    name: part,
                    type: 'dir',
                    status: 'unchanged',
                    children: [],
                };
                current.push(node);
            }
            if (!node.children)
                node.children = [];
            current = node.children;
        }
        stores_1.gitStore.write(repos);
    }
    return repo;
}
async function createFile(questId, filePath, content = '') {
    const repoDir = ensureRepoDir(questId);
    const target = path_1.default.join(repoDir, filePath);
    fs_1.default.mkdirSync(path_1.default.dirname(target), { recursive: true });
    fs_1.default.writeFileSync(target, content);
    const repos = stores_1.gitStore.read();
    const repo = repos.find((r) => r.id === questId);
    if (repo) {
        const parts = filePath.split('/').filter(Boolean);
        const fileName = parts.pop();
        let parent = repo.fileTree;
        for (const part of parts) {
            let node = parent.find((n) => n.name === part && n.type === 'dir');
            if (!node) {
                node = {
                    id: (0, uuid_1.v4)(),
                    path: part,
                    name: part,
                    type: 'dir',
                    status: 'unchanged',
                    children: [],
                };
                parent.push(node);
            }
            if (!node.children)
                node.children = [];
            parent = node.children;
        }
        parent.push({
            id: (0, uuid_1.v4)(),
            path: filePath,
            name: fileName,
            type: 'file',
            status: 'added',
        });
        stores_1.gitStore.write(repos);
    }
    return repo;
}
async function updateFile(questId, filePath, content) {
    const repoDir = ensureRepoDir(questId);
    const target = path_1.default.join(repoDir, filePath);
    fs_1.default.writeFileSync(target, content);
    const repos = stores_1.gitStore.read();
    const repo = repos.find((r) => r.id === questId);
    if (repo) {
        const node = findNode(repo.fileTree, filePath.split('/').filter(Boolean));
        if (node) {
            node.status = 'modified';
        }
        stores_1.gitStore.write(repos);
    }
    return repo;
}
async function downloadRepo(questId, outPath) {
    const repoDir = ensureRepoDir(questId);
    await new Promise((resolve, reject) => {
        const output = fs_1.default.createWriteStream(outPath);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));
        archive.pipe(output);
        archive.directory(repoDir, false);
        archive.finalize();
    });
    return outPath;
}
// Placeholder implementations for existing functions
async function getQuestRepoMeta(questId) {
    const repos = stores_1.gitStore.read();
    const repo = repos.find((r) => r.id === questId);
    if (!repo)
        return null;
    const repoDir = ensureRepoDir(questId);
    const git = (0, simple_git_1.default)(repoDir);
    try {
        const status = await git.status();
        const branchInfo = await git.branch();
        const log = await git.log({ maxCount: 1 });
        repo.status = {
            branch: status.current || undefined,
            ahead: status.ahead,
            behind: status.behind,
            isDirty: status.files.length > 0,
            uncommittedChanges: status.files.map((f) => ({
                path: typeof f === 'string' ? f : f.path,
                name: path_1.default.basename(typeof f === 'string' ? f : f.path),
                type: 'file',
                status: 'modified',
            })),
        };
        repo.branches = branchInfo.all;
        repo.lastCommitSha = log.latest?.hash || repo.lastCommitSha;
    }
    catch {
        // ignore git errors, return stored meta
    }
    return repo;
}
async function connectRepo(questId, repoUrl, branch) {
    const repoDir = ensureRepoDir(questId);
    const git = (0, simple_git_1.default)();
    await git.clone(repoUrl, repoDir, ['--branch', branch]);
    const repoGit = (0, simple_git_1.default)(repoDir);
    const branches = (await repoGit.branch()).all;
    const log = await repoGit.log({ maxCount: 1 });
    const repos = stores_1.gitStore.read();
    let repo = repos.find((r) => r.id === questId);
    repo = {
        id: questId,
        repoUrl,
        defaultBranch: branch,
        branches,
        lastCommitSha: log.latest?.hash || '',
        status: {},
        fileTree: [],
        commits: [],
    };
    const idx = repos.findIndex((r) => r.id === questId);
    if (idx >= 0)
        repos[idx] = repo;
    else
        repos.push(repo);
    stores_1.gitStore.write(repos);
    return repo;
}
async function syncRepo(questId) {
    const repoDir = ensureRepoDir(questId);
    const git = (0, simple_git_1.default)(repoDir);
    await git.pull();
    return (await getQuestRepoMeta(questId));
}
async function removeRepo(questId) {
    const repos = stores_1.gitStore.read();
    const idx = repos.findIndex((r) => r.id === questId);
    if (idx !== -1) {
        repos.splice(idx, 1);
        stores_1.gitStore.write(repos);
        const dir = path_1.default.join(reposRoot, questId);
        if (fs_1.default.existsSync(dir)) {
            fs_1.default.rmSync(dir, { recursive: true, force: true });
        }
    }
    return { success: true };
}
async function archiveHistory(questId) {
    const zipPath = path_1.default.join(reposRoot, `${questId}.zip`);
    await downloadRepo(questId, zipPath);
    return { archiveUrl: zipPath };
}
async function getDiff(questId, filePath, commitId) {
    const repoDir = ensureRepoDir(questId);
    const git = (0, simple_git_1.default)(repoDir);
    let diff = '';
    if (commitId) {
        const args = [commitId];
        if (filePath)
            args.push('--', filePath);
        diff = await git.show(args);
    }
    else if (filePath) {
        diff = await git.diff([filePath]);
    }
    else {
        diff = await git.diff();
    }
    return { diffMarkdown: diff };
}
async function getFileTree(questId) {
    const repoDir = ensureRepoDir(questId);
    const files = [];
    const folders = [];
    function walk(dir) {
        for (const item of fs_1.default.readdirSync(dir)) {
            const full = path_1.default.join(dir, item);
            const rel = path_1.default.relative(repoDir, full);
            if (fs_1.default.statSync(full).isDirectory()) {
                folders.push(rel);
                walk(full);
            }
            else {
                files.push(rel);
            }
        }
    }
    walk(repoDir);
    return { files, folders };
}
async function getCommits(questId) {
    const repoDir = ensureRepoDir(questId);
    const git = (0, simple_git_1.default)(repoDir);
    const log = await git.log();
    return log.all.map((c) => ({
        id: c.hash,
        message: c.message,
        timestamp: c.date,
        author: { id: c.author_email, username: c.author_name },
    }));
}
