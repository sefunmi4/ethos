import { v4 as uuidv4 } from 'uuid';
import { pool, usePg } from '../db';

export function logBoardAction(
  boardId: string,
  action: 'create' | 'update' | 'delete',
  userId: string
): void {
  if (!usePg) return;

  pool
    .query(
      'INSERT INTO board_logs (id, boardId, action, userId, timestamp) VALUES ($1,$2,$3,$4,NOW())',
      [uuidv4(), boardId, action, userId]
    )
    .catch((err: any) => console.error('Failed to log board action', err));
}

