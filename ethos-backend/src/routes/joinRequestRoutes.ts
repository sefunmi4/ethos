import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
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

// Create a new join request
router.post('/', authMiddleware, (req: Request, res: Response): void => {
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
router.patch('/:id', authMiddleware, (req: Request, res: Response): void => {
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
