import express, { Request, Response } from 'express';
import authOptional from '../middleware/authOptional';
import { usersStore } from '../models/stores';

const router = express.Router();

// GET /api/users/:id - fetch public profile
router.get('/:id', authOptional, (req: Request<{ id: string }>, res: Response): void => {
  const user = usersStore.read().find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Return only public fields
  const { id, username, tags, bio, links, experienceTimeline } = user as any;
  res.json({ id, username, tags, bio, links, experienceTimeline });
});

export default router;
