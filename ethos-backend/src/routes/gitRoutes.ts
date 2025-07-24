import express, { Request, Response } from 'express';
import path from 'path';
import { error } from '../utils/logger';
import { authMiddleware } from '../middleware/authMiddleware';
import { pool } from '../db';
import {
  getQuestRepoMeta,
  connectRepo,
  syncRepo,
  removeRepo,
  archiveHistory,
  getDiff,
  getFileTree,
  getCommits,
  initRepo,
  createFolder,
  createFile,
  updateFile,
  downloadRepo,
  uploadRepoItem,
} from '../services/gitService';
import type { AuthenticatedRequest } from '../types/express';

const router = express.Router();

const usePg = !!process.env.DATABASE_URL && process.env.NODE_ENV !== 'test';

//
// ✅ GET /api/git/status/:questId
//
router.get(
  '/status/:questId',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ questId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const meta = await getQuestRepoMeta(req.params.questId);
      res.json(meta);
    } catch (err) {
      error('[GIT STATUS ERROR]', err);
      res.status(500).json({ error: 'Failed to get git status' });
    }
  }
);

//
// ✅ POST /api/git/connect
//
router.post(
  '/connect',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{}, any, { questId: string; repoUrl: string; branch?: string }>,
    res: Response
  ): Promise<void> => {
    const { questId, repoUrl, branch = 'main' } = req.body;

    try {
      const meta = await connectRepo(questId, repoUrl, branch);
      res.json(meta);
    } catch (err) {
      error('[GIT CONNECT ERROR]', err);
      res.status(500).json({ error: 'Failed to connect git repo' });
    }
  }
);

//
// ✅ POST /api/git/sync
//
router.post(
  '/sync',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{}, any, { questId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const meta = await syncRepo(req.body.questId);
      res.json(meta);
    } catch (err) {
      error('[GIT SYNC ERROR]', err);
      res.status(500).json({ error: 'Git sync failed' });
    }
  }
);

//
// ✅ DELETE /api/git/disconnect/:questId
//
router.delete(
  '/disconnect/:questId',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ questId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const result = await removeRepo(req.params.questId);
      res.json(result);
    } catch (err) {
      error('[GIT DISCONNECT ERROR]', err);
      res.status(500).json({ error: 'Failed to remove git repo' });
    }
  }
);

//
// ✅ POST /api/git/archive
//
router.post(
  '/archive',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{}, any, { questId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const archive = await archiveHistory(req.body.questId);
      res.json(archive);
    } catch (err) {
      error('[GIT ARCHIVE ERROR]', err);
      res.status(500).json({ error: 'Failed to archive git history' });
    }
  }
);

//
// ✅ GET /api/git/diff/:questId
//
router.get(
  '/diff/:questId',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ questId: string }, any, any, { filePath?: string; commitId?: string }>,
    res: Response
  ): Promise<void> => {
    const { filePath, commitId } = req.query;

    try {
      const diff = await getDiff(
        req.params.questId,
        filePath as string,
        commitId as string
      );
      res.json(diff);
    } catch (err) {
      error('[GIT DIFF ERROR]', err);
      res.status(500).json({ error: 'Failed to fetch git diff' });
    }
  }
);

//
// ✅ GET /api/git/files/:questId
//
router.get(
  '/files/:questId',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ questId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const fileTree = await getFileTree(req.params.questId);
      res.json(fileTree);
    } catch (err) {
      error('[GIT FILES ERROR]', err);
      res.status(500).json({ error: 'Failed to fetch git file tree' });
    }
  }
);

//
// ✅ GET /api/git/commits/:questId
//
router.get(
  '/commits/:questId',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ questId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const commits = await getCommits(req.params.questId);
      res.json(commits);
    } catch (err) {
      error('[GIT COMMITS ERROR]', err);
      res.status(500).json({ error: 'Failed to fetch git commit history' });
    }
  }
);

// ✅ POST /api/git/create
// Initialize a new repo for a quest
router.post('/create', authMiddleware, async (
  req: AuthenticatedRequest<{}, any, { questId: string; name: string }>,
  res: Response
): Promise<void> => {
  try {
    const repo = await initRepo(req.body.questId, req.body.name);
    res.json(repo);
  } catch (err) {
    error('[GIT CREATE ERROR]', err);
    res.status(500).json({ error: 'Failed to create repo' });
  }
});

//
// ✅ POST /api/git/folders
// Create a folder inside a repo
router.post('/folders', authMiddleware, async (
  req: AuthenticatedRequest<{}, any, { questId: string; folderPath: string }>,
  res: Response
): Promise<void> => {
  try {
    const repo = await createFolder(req.body.questId, req.body.folderPath);
    res.json(repo);
  } catch (err) {
    error('[GIT CREATE FOLDER ERROR]', err);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

//
// ✅ POST /api/git/files
// Create a new file
router.post('/files', authMiddleware, async (
  req: AuthenticatedRequest<{}, any, { questId: string; filePath: string; content?: string }>,
  res: Response
): Promise<void> => {
  try {
    const repo = await createFile(req.body.questId, req.body.filePath, req.body.content || '');
    res.json(repo);
  } catch (err) {
    error('[GIT CREATE FILE ERROR]', err);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

//
// ✅ PUT /api/git/files
// Update file content
router.put('/files', authMiddleware, async (
  req: AuthenticatedRequest<{}, any, { questId: string; filePath: string; content: string }>,
  res: Response
): Promise<void> => {
  try {
    const repo = await updateFile(req.body.questId, req.body.filePath, req.body.content);
    res.json(repo);
  } catch (err) {
    error('[GIT UPDATE FILE ERROR]', err);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

//
// ✅ POST /api/git/upload
// Create a file or folder and commit the change
router.post('/upload', authMiddleware, async (
  req: AuthenticatedRequest<{}, any, { questId: string; filePath: string; content?: string; isFolder?: boolean; message?: string }>,
  res: Response
): Promise<void> => {
  const { questId, filePath, content = '', isFolder = false, message = 'upload' } = req.body;
  try {
    const repo = await uploadRepoItem(questId, filePath, content, isFolder, message);
    res.json(repo);
  } catch (err) {
    error('[GIT UPLOAD ERROR]', err);
    res.status(500).json({ error: 'Failed to upload item' });
  }
});

//
// ✅ GET /api/git/download/:questId
// Download repo as zip
router.get('/download/:questId', authMiddleware, async (
  req: AuthenticatedRequest<{ questId: string }>,
  res: Response
): Promise<void> => {
  try {
    const zipPath = path.join('/tmp', `${req.params.questId}.zip`);
    await downloadRepo(req.params.questId, zipPath);
    res.download(zipPath);
  } catch (err) {
    error('[GIT DOWNLOAD ERROR]', err);
    res.status(500).json({ error: 'Failed to download repo' });
  }
});
export default router;
