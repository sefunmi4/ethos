import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import type { AuthenticatedRequest } from '../types/express';
import { postsStore, joinRequestsStore } from '../models/stores';
import { pool, usePg } from '../db';
import type { DBJoinRequest } from '../types/db';
import { io } from '../server';

interface JoinRequest {
  id: string;
  taskId: string;
  ownerId: string;
  requesterId: string;
  status: 'pending' | 'approved' | 'declined';
}

const joinRequests: JoinRequest[] = [];

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

// Create a new join request
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { taskId, ownerId } = req.body as { taskId?: string; ownerId?: string };
  const requesterId = req.user?.id;

  if (!taskId || !ownerId || !requesterId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const joinRequest: JoinRequest = {
    id: uuidv4(),
    taskId,
    ownerId,
    requesterId,
    status: 'pending',
  };
  joinRequests.push(joinRequest);

  // Notify relevant rooms of the new join request
  [
    `task:${taskId}`,
    `user:${ownerId}`,
    `user:${requesterId}`,
  ].forEach((room) => io.to(room).emit('join_request:created', joinRequest));

  res.status(201).json(joinRequest);
});

// Approve or decline a join request
router.patch('/:id', authMiddleware, (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body as { status?: 'approved' | 'declined' };

  const jr = joinRequests.find((r) => r.id === id);
  if (!jr) {
    res.status(404).json({ error: 'Join request not found' });
    return;
  }
  if (status !== 'approved' && status !== 'declined') {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  jr.status = status;

  // Notify relevant rooms of the update
  [
    `task:${jr.taskId}`,
    `user:${jr.ownerId}`,
    `user:${jr.requesterId}`,
  ].forEach((room) => io.to(room).emit('join_request:updated', jr));

  res.json(jr);
});

export default router;
