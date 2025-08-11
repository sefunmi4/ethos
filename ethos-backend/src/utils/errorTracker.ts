import { createDataStore } from './loaders';

export interface Quest404Record {
  questId: string;
  path: string;
  count: number;
  lastOccurred: string;
}

const quest404Store = createDataStore<Quest404Record[]>(
  'quest404.json',
  []
);

export function logQuest404(questId: string, path: string): void {
  const logs = quest404Store.read();
  const existing = logs.find(
    (l) => l.questId === questId && l.path === path
  );
  const now = new Date().toISOString();
  if (existing) {
    existing.count += 1;
    existing.lastOccurred = now;
  } else {
    logs.push({ questId, path, count: 1, lastOccurred: now });
  }
  quest404Store.write(logs);
}

