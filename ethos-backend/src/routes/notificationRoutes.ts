import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import authOptional from '../middleware/authOptional';
import { notificationsStore } from '../models/stores';

import type { DBNotification } from '../types/db';

const router = express.Router();

// GET /api/notifications - return notifications for current user
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const all = notificationsStore.read();
  const userNotes = all.filter(n => n.userId === userId);
  res.json(userNotes);
});

// POST /api/notifications - create a new notification for a user
router.post('/', authOptional, (req: Request<any, any, { userId: string; message: string; link?: string }>, res: Response) => {
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
  const notes = notificationsStore.read();
  notificationsStore.write([...notes, newNote]);
  res.status(201).json(newNote);
});

// PATCH /api/notifications/:id/read - mark a notification read
router.patch('/:id/read', authMiddleware, (req: Request<{ id: string }>, res: Response) => {
  const userId = (req as any).user?.id;
  const { id } = req.params;
  const notes = notificationsStore.read();
  const note = notes.find(n => n.id === id && n.userId === userId);
  if (!note) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  note.read = true;
  notificationsStore.write(notes);
  res.json(note);
});

export default router;
