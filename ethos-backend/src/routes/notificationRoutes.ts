import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import authOptional from '../middleware/authOptional';
import { pool, usePg } from '../db';
import { notificationsStore } from '../models/stores';

import type { DBNotification } from '../types/db';

const router = express.Router();


// GET /api/notifications - return notifications for current user
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  try {
    if (usePg) {
      const result = await pool.query('SELECT * FROM notifications WHERE userid = $1', [userId]);
      res.json(result.rows);
    } else {
      const notes = notificationsStore.read().filter((n) => n.userId === userId);
      res.json(notes);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/notifications - create a new notification for a user
router.post('/', authOptional, async (req: Request<any, any, { userId: string; message: string; link?: string }>, res: Response): Promise<void> => {
  const { userId, message, link } = req.body;
  if (!userId || !message) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const newNote: DBNotification = {
    id: uuidv4(),
    userId,
    message,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  };
  try {
    if (usePg) {
      await pool.query(
        'INSERT INTO notifications (id, userid, message, link, read, createdat) VALUES ($1,$2,$3,$4,$5,$6)',
        [newNote.id, newNote.userId, newNote.message, newNote.link, newNote.read, newNote.createdAt]
      );
    } else {
      const notes = notificationsStore.read();
      notes.push(newNote);
      notificationsStore.write(notes);
    }
    res.status(201).json(newNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/notifications/:id/read - mark a notification read
router.patch('/:id/read', authMiddleware, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  const { id } = req.params;
    try {
      if (usePg) {
        const result = await pool.query(
          'UPDATE notifications SET read = true WHERE id = $1 AND userid = $2 RETURNING *',
          [id, userId]
        );
        const row = result.rows[0];
        if (!row) {
          res.status(404).json({ error: 'Notification not found' });
          return;
        }
        res.json(row);
      } else {
        const notes = notificationsStore.read();
        const note = notes.find(n => n.id === id && n.userId === userId);
        if (!note) {
          res.status(404).json({ error: 'Notification not found' });
          return;
        }
        note.read = true;
        notificationsStore.write(notes);
        res.json(note);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

export default router;
