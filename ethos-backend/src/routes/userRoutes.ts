import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import authOptional from '../middleware/authOptional';
import { authMiddleware } from '../middleware/authMiddleware';
import { usersStore, notificationsStore } from '../models/stores';
import { pool } from '../db';

const usePg = process.env.NODE_ENV !== 'test';

const router = express.Router();

// GET /api/users?search= - search by username
router.get(
  '/',
  authOptional,
  async (
    req: Request<{}, any, any, { search?: string }>,
    res: Response
  ): Promise<void> => {
    const { search } = req.query;

    if (usePg) {
      try {
        let query = 'SELECT id, username FROM users';
        const params: any[] = [];
        if (search) {
          query += ' WHERE LOWER(username) LIKE $1';
          params.push(`%${search.toLowerCase()}%`);
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    let users = usersStore
      .read()
      .map(u => ({ id: u.id, username: u.username }));
    if (search) {
      const term = search.toLowerCase();
      users = users.filter(u => u.username.toLowerCase().includes(term));
    }
    res.json(users);
  }
);

// GET /api/users/:id - fetch public profile
router.get(
  '/:id',
  authOptional,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    if (usePg) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [
          req.params.id,
        ]);
        const row = result.rows[0];
        if (!row) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        const { id, username, tags, bio, links, experienceTimeline, xp } = row;
        res.json({ id, username, tags, bio, links, experienceTimeline, xp });
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const user = usersStore.read().find(u => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return only public fields
    const { id, username, tags, bio, links, experienceTimeline, xp } = user as any;
    res.json({ id, username, tags, bio, links, experienceTimeline, xp });
  }
);

// POST /api/users/:id/follow - follow a user
router.post(
  '/:id/follow',
  authMiddleware,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    if (usePg) {
      try {
        const followerId = (req as any).user?.id;
        const targetResult = await pool.query(
          'SELECT id, followers FROM users WHERE id = $1',
          [req.params.id]
        );
        const followerResult = await pool.query(
          'SELECT id, following, username FROM users WHERE id = $1',
          [followerId]
        );
        const target = targetResult.rows[0];
        const follower = followerResult.rows[0];
        if (!target || !follower) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        const newFollowers = Array.from(
          new Set([...(target.followers || []), followerId])
        );
        const newFollowing = Array.from(
          new Set([...(follower.following || []), target.id])
        );
        await pool.query('UPDATE users SET followers = $1 WHERE id = $2', [
          newFollowers,
          target.id,
        ]);
        await pool.query('UPDATE users SET following = $1 WHERE id = $2', [
          newFollowing,
          followerId,
        ]);

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

        res.json({ followers: newFollowers });
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const users = usersStore.read();
    const target = users.find(u => u.id === req.params.id);
    const follower = users.find(u => u.id === (req as any).user?.id);
    if (!target || !follower) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    target.followers = Array.from(
      new Set([...(target.followers || []), follower.id])
    );
    follower.following = Array.from(
      new Set([...(follower.following || []), target.id])
    );
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
  }
);

// POST /api/users/:id/unfollow - unfollow a user
router.post(
  '/:id/unfollow',
  authMiddleware,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    if (usePg) {
      try {
        const followerId = (req as any).user?.id;
        const targetResult = await pool.query(
          'SELECT id, followers FROM users WHERE id = $1',
          [req.params.id]
        );
        const followerResult = await pool.query(
          'SELECT id, following FROM users WHERE id = $1',
          [followerId]
        );
        const target = targetResult.rows[0];
        const follower = followerResult.rows[0];
        if (!target || !follower) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        const newFollowers = (target.followers || []).filter(
          (id: string) => id !== followerId
        );
        const newFollowing = (follower.following || []).filter(
          (id: string) => id !== target.id
        );
        await pool.query('UPDATE users SET followers = $1 WHERE id = $2', [
          newFollowers,
          target.id,
        ]);
        await pool.query('UPDATE users SET following = $1 WHERE id = $2', [
          newFollowing,
          followerId,
        ]);
        res.json({ followers: newFollowers });
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

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
  }
);

export default router;
