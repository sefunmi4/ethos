import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import authOptional from '../middleware/authOptional';
import { authMiddleware } from '../middleware/authMiddleware';
import { pool } from '../db';
import { normalizeUserPayload } from '../utils/payloadTransforms';


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

    try {
      let query = 'SELECT id, username FROM users';
      const params: any[] = [];
      if (search) {
        query += ' WHERE LOWER(username) LIKE $1';
        params.push(`%${search.toLowerCase()}%`);
      }
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// GET /api/users/:id - fetch public profile
router.get(
  '/:id',
  authOptional,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// PUT /api/users/:id - update profile accepting legacy and new payloads
router.put(
  '/:id',
  authMiddleware,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const { username, bio } = normalizeUserPayload(req.body);
      await pool.query('UPDATE users SET username = $1, bio = $2 WHERE id = $3', [
        username,
        bio,
        req.params.id,
      ]);
      res.json({ id: req.params.id, username, bio });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// POST /api/users/:id/follow - follow a user
router.post(
  '/:id/follow',
  authMiddleware,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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

      await pool.query(
        'INSERT INTO notifications (id, userid, message, link, read, createdat) VALUES ($1,$2,$3,$4,$5,$6)',
        [
          uuidv4(),
          target.id,
          `${follower.username} followed you`,
          `/profile/${follower.id}`,
          false,
          new Date().toISOString(),
        ]
      );

      res.json({ followers: newFollowers });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// POST /api/users/:id/unfollow - unfollow a user
router.post(
  '/:id/unfollow',
  authMiddleware,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

export default router;
