import { v4 as uuidv4 } from 'uuid';
import type { DBBoardLog } from '../types/db';
import { boardLogsStore } from '../models/memoryStores';

export function logBoardAction(boardId: string, action: 'create' | 'update' | 'delete', userId: string): void {
  const logs = boardLogsStore.read();
  logs.push({ id: uuidv4(), boardId, action, userId, timestamp: new Date().toISOString() });
  boardLogsStore.write(logs);
}

