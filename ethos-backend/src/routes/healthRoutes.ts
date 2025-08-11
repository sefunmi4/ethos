import { Router } from 'express';
import { pool, usePg } from '../db';

const router = Router();


router.get('/', async (_req, res): Promise<void> => {
  if (usePg) {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok' });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'db_error' });
      return;
    }
  }
  res.json({ status: 'ok' });
});

export default router;
