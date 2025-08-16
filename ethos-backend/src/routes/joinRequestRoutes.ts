import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import { joinRequestsStore } from '../models/stores';
import type { DBTaskJoinRequest } from '../types/db';
import type { JoinRequestStatus } from '../types/api';
import type { AuthenticatedRequest } from '../types/express';

const router = express.Router();

// Helper to update status
const setStatus = (
  req: DBTaskJoinRequest,
  status: JoinRequestStatus,
  userId: string
): DBTaskJoinRequest => {
  return {
    ...req,
    status,
    decidedAt: new Date().toISOString(),
    decidedBy: userId,
  };
};

// Create a new join request
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { taskId, requesterId, requestPostId, meta } = req.body;
  if (!taskId || !requesterId) {
    res.status(400).json({ error: 'taskId and requesterId are required' });
    return;
  }
  const newReq: DBTaskJoinRequest = {
    id: uuidv4(),
    taskId,
    requesterId,
    requestPostId,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    meta,
  };
  const requests = joinRequestsStore.read();
  joinRequestsStore.write([...requests, newReq]);
  res.status(201).json(newReq);
});

// Approve a request
router.post('/:id/approve', authMiddleware, (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
  const { id } = req.params;
  const userId = req.user?.id || '';
  const requests = joinRequestsStore.read();
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }
  const updated = setStatus(requests[idx], 'APPROVED', userId);
  requests[idx] = updated;
  joinRequestsStore.write(requests);
  res.json(updated);
});

// Reject a request
router.post('/:id/reject', authMiddleware, (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
  const { id } = req.params;
  const userId = req.user?.id || '';
  const requests = joinRequestsStore.read();
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }
  const updated = setStatus(requests[idx], 'REJECTED', userId);
  requests[idx] = updated;
  joinRequestsStore.write(requests);
  res.json(updated);
});

export default router;
