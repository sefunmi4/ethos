"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const authMiddleware_1 = require("../middleware/authMiddleware");
const passwordUtils_1 = require("../utils/passwordUtils");
const db_1 = require("../db");
const gitService_1 = require("../services/gitService");
const router = express_1.default.Router();
//
// ✅ POST /api/git/account
//
router.post('/account', authMiddleware_1.authMiddleware, async (req, res) => {
    const { provider, username, token } = req.body;
    if (!provider || !username || !token) {
        res.status(400).json({ error: 'Missing provider, username or token' });
        return;
    }
    try {
        if (!db_1.usePg) {
            res.status(500).json({ error: 'PostgreSQL not available' });
            return;
        }
        // ensure user exists
        const userRes = await db_1.pool.query('SELECT id FROM users WHERE id = $1', [
            req.user?.id,
        ]);
        if (userRes.rowCount === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const tokenHash = await (0, passwordUtils_1.hashPassword)(token);
        await db_1.pool.query(`INSERT INTO git_accounts (user_id, provider, username, token_hash, linked_repo_ids)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id, provider, username)
         DO UPDATE SET token_hash = EXCLUDED.token_hash`, [req.user?.id, provider, username, tokenHash, JSON.stringify([])]);
        const { rows } = await db_1.pool.query('SELECT provider, username, token_hash AS "tokenHash", linked_repo_ids AS "linkedRepoIds" FROM git_accounts WHERE user_id = $1', [req.user?.id]);
        res.json({ gitAccounts: rows });
    }
    catch (err) {
        (0, logger_1.error)('[GIT ACCOUNT ERROR]', err);
        res.status(500).json({ error: 'Failed to save git account' });
    }
});
//
// ✅ GET /api/git/status/:questId
//
router.get('/status/:questId', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const meta = await (0, gitService_1.getQuestRepoMeta)(req.params.questId);
        res.json(meta);
    }
    catch (err) {
        (0, logger_1.error)('[GIT STATUS ERROR]', err);
        res.status(500).json({ error: 'Failed to get git status' });
    }
});
//
// ✅ POST /api/git/connect
//
router.post('/connect', authMiddleware_1.authMiddleware, async (req, res) => {
    const { questId, repoUrl, branch = 'main' } = req.body;
    try {
        const meta = await (0, gitService_1.connectRepo)(questId, repoUrl, branch);
        res.json(meta);
    }
    catch (err) {
        (0, logger_1.error)('[GIT CONNECT ERROR]', err);
        res.status(500).json({ error: 'Failed to connect git repo' });
    }
});
//
// ✅ POST /api/git/sync
//
router.post('/sync', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const meta = await (0, gitService_1.syncRepo)(req.body.questId);
        res.json(meta);
    }
    catch (err) {
        (0, logger_1.error)('[GIT SYNC ERROR]', err);
        res.status(500).json({ error: 'Git sync failed' });
    }
});
//
// ✅ DELETE /api/git/disconnect/:questId
//
router.delete('/disconnect/:questId', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const result = await (0, gitService_1.removeRepo)(req.params.questId);
        res.json(result);
    }
    catch (err) {
        (0, logger_1.error)('[GIT DISCONNECT ERROR]', err);
        res.status(500).json({ error: 'Failed to remove git repo' });
    }
});
//
// ✅ POST /api/git/archive
//
router.post('/archive', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const archive = await (0, gitService_1.archiveHistory)(req.body.questId);
        res.json(archive);
    }
    catch (err) {
        (0, logger_1.error)('[GIT ARCHIVE ERROR]', err);
        res.status(500).json({ error: 'Failed to archive git history' });
    }
});
//
// ✅ GET /api/git/diff/:questId
//
router.get('/diff/:questId', authMiddleware_1.authMiddleware, async (req, res) => {
    const { filePath, commitId } = req.query;
    try {
        const diff = await (0, gitService_1.getDiff)(req.params.questId, filePath, commitId);
        res.json(diff);
    }
    catch (err) {
        (0, logger_1.error)('[GIT DIFF ERROR]', err);
        res.status(500).json({ error: 'Failed to fetch git diff' });
    }
});
//
// ✅ GET /api/git/files/:questId
//
router.get('/files/:questId', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const fileTree = await (0, gitService_1.getFileTree)(req.params.questId);
        res.json(fileTree);
    }
    catch (err) {
        (0, logger_1.error)('[GIT FILES ERROR]', err);
        res.status(500).json({ error: 'Failed to fetch git file tree' });
    }
});
//
// ✅ GET /api/git/commits/:questId
//
router.get('/commits/:questId', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const commits = await (0, gitService_1.getCommits)(req.params.questId);
        res.json(commits);
    }
    catch (err) {
        (0, logger_1.error)('[GIT COMMITS ERROR]', err);
        res.status(500).json({ error: 'Failed to fetch git commit history' });
    }
});
// ✅ POST /api/git/create
// Initialize a new repo for a quest
router.post('/create', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const repo = await (0, gitService_1.initRepo)(req.body.questId, req.body.name);
        res.json(repo);
    }
    catch (err) {
        (0, logger_1.error)('[GIT CREATE ERROR]', err);
        res.status(500).json({ error: 'Failed to create repo' });
    }
});
//
// ✅ POST /api/git/folders
// Create a folder inside a repo
router.post('/folders', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const repo = await (0, gitService_1.createFolder)(req.body.questId, req.body.folderPath);
        res.json(repo);
    }
    catch (err) {
        (0, logger_1.error)('[GIT CREATE FOLDER ERROR]', err);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});
//
// ✅ POST /api/git/files
// Create a new file
router.post('/files', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const repo = await (0, gitService_1.createFile)(req.body.questId, req.body.filePath, req.body.content || '');
        res.json(repo);
    }
    catch (err) {
        (0, logger_1.error)('[GIT CREATE FILE ERROR]', err);
        res.status(500).json({ error: 'Failed to create file' });
    }
});
//
// ✅ PUT /api/git/files
// Update file content
router.put('/files', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const repo = await (0, gitService_1.updateFile)(req.body.questId, req.body.filePath, req.body.content);
        res.json(repo);
    }
    catch (err) {
        (0, logger_1.error)('[GIT UPDATE FILE ERROR]', err);
        res.status(500).json({ error: 'Failed to update file' });
    }
});
//
// ✅ POST /api/git/upload
// Create a file or folder and commit the change
router.post('/upload', authMiddleware_1.authMiddleware, async (req, res) => {
    const { questId, filePath, content = '', isFolder = false, message = 'upload' } = req.body;
    try {
        const repo = await (0, gitService_1.uploadRepoItem)(questId, filePath, content, isFolder, message);
        res.json(repo);
    }
    catch (err) {
        (0, logger_1.error)('[GIT UPLOAD ERROR]', err);
        res.status(500).json({ error: 'Failed to upload item' });
    }
});
//
// ✅ GET /api/git/download/:questId
// Download repo as zip
router.get('/download/:questId', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const zipPath = path_1.default.join('/tmp', `${req.params.questId}.zip`);
        await (0, gitService_1.downloadRepo)(req.params.questId, zipPath);
        res.download(zipPath);
    }
    catch (err) {
        (0, logger_1.error)('[GIT DOWNLOAD ERROR]', err);
        res.status(500).json({ error: 'Failed to download repo' });
    }
});
exports.default = router;
