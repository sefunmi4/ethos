import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getQuestRepoMeta,
  connectRepo,
  syncRepo,
  removeRepo,
  archiveHistory,
  getDiff,
  getFileTree,
  getCommits,
} from '../services/gitService';
import type { AuthenticatedRequest } from '../types/express';

const router = express.Router();

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
      console.error('[GIT STATUS ERROR]', err);
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
      console.error('[GIT CONNECT ERROR]', err);
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
      console.error('[GIT SYNC ERROR]', err);
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
      console.error('[GIT DISCONNECT ERROR]', err);
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
      console.error('[GIT ARCHIVE ERROR]', err);
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
      console.error('[GIT DIFF ERROR]', err);
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
      console.error('[GIT FILES ERROR]', err);
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
      console.error('[GIT COMMITS ERROR]', err);
      res.status(500).json({ error: 'Failed to fetch git commit history' });
    }
  }
);

export default router;