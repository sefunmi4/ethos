import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import type { AuthenticatedRequest } from '../types/express';
import { postsStore, joinRequestsStore } from '../models/stores';
import { pool, usePg } from '../db';
import type { DBJoinRequest } from '../types/db';

const router = express.Router();

router.post(
  '/tasks/:taskId/join-requests',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ taskId: string }>,
    res: Response
  ): Promise<void> => {
    const taskId = req.params.taskId;
    const userId = req.user!.id;
    try {
      if (usePg) {
        const { rows: taskRows } = await pool.query(
          'SELECT id, authorid FROM posts WHERE id = $1',
          [taskId]
        );
        if (taskRows.length === 0) {
          res.status(404).json({ error: 'Task not found' });
          return;
        }
        if (taskRows[0].authorid === userId) {
          res.status(400).json({ error: 'Cannot request to join own task' });
          return;
        }
        const { rows: existing } = await pool.query(
          'SELECT id FROM join_requests WHERE task_id = $1 AND user_id = $2',
          [taskId, userId]
        );
        if (existing.length > 0) {
          res.status(400).json({ error: 'Join request already exists' });
          return;
        }
        const id = uuidv4();
        await pool.query(
          'INSERT INTO join_requests (id, task_id, user_id, status) VALUES ($1,$2,$3,$4)',
          [id, taskId, userId, 'pending']
        );
        res.json({ id, taskId, userId, status: 'pending' });
        return;
      }

      const posts = postsStore.read();
      const task = posts.find(p => p.id === taskId && p.type === 'task');
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      if (task.authorId === userId) {
        res.status(400).json({ error: 'Cannot request to join own task' });
        return;
      }
      const joinRequests = joinRequestsStore.read();
      if (joinRequests.some(j => j.taskId === taskId && j.userId === userId)) {
        res.status(400).json({ error: 'Join request already exists' });
        return;
      }
      const newReq: DBJoinRequest = {
        id: uuidv4(),
        taskId,
        userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      joinRequestsStore.write([...joinRequests, newReq]);
      res.json(newReq);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

router.post(
  '/join-requests/:id/approve',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;
    const userId = req.user!.id;
    try {
      if (usePg) {
        const { rows } = await pool.query(
          'SELECT * FROM join_requests WHERE id = $1',
          [id]
        );
        if (rows.length === 0) {
          res.status(404).json({ error: 'Join request not found' });
          return;
        }
        const jr = rows[0];
        const { rows: taskRows } = await pool.query(
          'SELECT authorid FROM posts WHERE id = $1',
          [jr.task_id]
        );
        if (taskRows.length === 0) {
          res.status(404).json({ error: 'Task not found' });
          return;
        }
        if (taskRows[0].authorid !== userId) {
          res.status(403).json({ error: 'Not task owner' });
          return;
        }
        await pool.query(
          'UPDATE join_requests SET status = $1 WHERE id = $2',
          ['approved', id]
        );
        res.json({ id, taskId: jr.task_id, userId: jr.user_id, status: 'approved' });
        return;
      }

      const joinRequests = joinRequestsStore.read();
      const jr = joinRequests.find(j => j.id === id);
      if (!jr) {
        res.status(404).json({ error: 'Join request not found' });
        return;
      }
      const task = postsStore.read().find(p => p.id === jr.taskId);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      if (task.authorId !== userId) {
        res.status(403).json({ error: 'Not task owner' });
        return;
      }
      jr.status = 'approved';
      joinRequestsStore.write([...joinRequests]);
      res.json(jr);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

router.post(
  '/join-requests/:id/decline',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;
    const userId = req.user!.id;
    try {
      if (usePg) {
        const { rows } = await pool.query(
          'SELECT * FROM join_requests WHERE id = $1',
          [id]
        );
        if (rows.length === 0) {
          res.status(404).json({ error: 'Join request not found' });
          return;
        }
        const jr = rows[0];
        const { rows: taskRows } = await pool.query(
          'SELECT authorid FROM posts WHERE id = $1',
          [jr.task_id]
        );
        if (taskRows.length === 0) {
          res.status(404).json({ error: 'Task not found' });
          return;
        }
        if (taskRows[0].authorid !== userId) {
          res.status(403).json({ error: 'Not task owner' });
          return;
        }
        await pool.query(
          'UPDATE join_requests SET status = $1 WHERE id = $2',
          ['declined', id]
        );
        res.json({ id, taskId: jr.task_id, userId: jr.user_id, status: 'declined' });
        return;
      }

      const joinRequests = joinRequestsStore.read();
      const jr = joinRequests.find(j => j.id === id);
      if (!jr) {
        res.status(404).json({ error: 'Join request not found' });
        return;
      }
      const task = postsStore.read().find(p => p.id === jr.taskId);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      if (task.authorId !== userId) {
        res.status(403).json({ error: 'Not task owner' });
        return;
      }
      jr.status = 'declined';
      joinRequestsStore.write([...joinRequests]);
      res.json(jr);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

export default router;
