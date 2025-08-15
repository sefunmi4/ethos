import { v4 as uuidv4 } from 'uuid';
import type { DBBoardLog } from '../types/db';
import { boardLogsStore } from '../models/memoryStores';
import { pool, usePg } from '../db';

export function logBoardAction(
  boardId: string,
  action: 'create' | 'update' | 'delete',
  userId: string
): void {
  const log: DBBoardLog = {
    id: uuidv4(),
    boardId,
    action,
    userId,
    timestamp: new Date().toISOString(),
  };

  if (usePg) {
    pool
      .query(
        'INSERT INTO board_logs (id, boardId, action, userId, timestamp) VALUES ($1,$2,$3,$4,$5)',
        [log.id, log.boardId, log.action, log.userId, log.timestamp]
      )
      .catch((err: unknown) => console.error('Failed to log board action', err));
    return;
  }

  const logs = boardLogsStore.read();
  logs.push(log);
  boardLogsStore.write(logs);
}

