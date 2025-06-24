import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import authOptional from '../middleware/authOptional';
import { authMiddleware } from '../middleware/authMiddleware';
import { usersStore, notificationsStore } from '../models/stores';

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

// POST /api/users/:id/follow - follow a user
router.post('/:id/follow', authMiddleware, (req: Request<{ id: string }>, res: Response) => {
  const users = usersStore.read();
  const target = users.find(u => u.id === req.params.id);
  const follower = users.find(u => u.id === (req as any).user?.id);
  if (!target || !follower) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  target.followers = Array.from(new Set([...(target.followers || []), follower.id]));
  follower.following = Array.from(new Set([...(follower.following || []), target.id]));
  usersStore.write(users);

  const notes = notificationsStore.read();
  const newNote = {
    id: uuidv4(),
    userId: target.id,
    message: `${follower.username} followed you`,
    link: `/profile/${follower.id}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notificationsStore.write([...notes, newNote]);

  res.json({ followers: target.followers });
});

// POST /api/users/:id/unfollow - unfollow a user
router.post('/:id/unfollow', authMiddleware, (req: Request<{ id: string }>, res: Response) => {
  const users = usersStore.read();
  const target = users.find(u => u.id === req.params.id);
  const follower = users.find(u => u.id === (req as any).user?.id);
  if (!target || !follower) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  target.followers = (target.followers || []).filter(id => id !== follower.id);
  follower.following = (follower.following || []).filter(id => id !== target.id);
  usersStore.write(users);
  res.json({ followers: target.followers });
});

export default router;
