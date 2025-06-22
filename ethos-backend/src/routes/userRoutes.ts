import express, { Request, Response } from 'express';
import authOptional from '../middleware/authOptional';
import { usersStore } from '../models/stores';

const router = express.Router();

// GET /api/users?search= - search by username
router.get('/', authOptional, (
  req: Request<{}, any, any, { search?: string }>,
  res: Response
): void => {
  const { search } = req.query;
  let users = usersStore.read().map(u => ({ id: u.id, username: u.username }));
  if (search) {
    const term = search.toLowerCase();
    users = users.filter(u => u.username.toLowerCase().includes(term));
  }
  res.json(users);
});

// GET /api/users/:id - fetch public profile
router.get('/:id', authOptional, (req: Request<{ id: string }>, res: Response): void => {
  const user = usersStore.read().find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Return only public fields
  const { id, username, tags, bio, links, experienceTimeline, xp } = user as any;
  res.json({ id, username, tags, bio, links, experienceTimeline, xp });
});

export default router;
