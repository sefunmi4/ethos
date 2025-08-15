export interface Quest404Record {
  questId: string;
  path: string;
  count: number;
  lastOccurred: string;
}

// simple in-memory log replacing the previous JSON-based store
const quest404Logs: Quest404Record[] = [];

export function logQuest404(questId: string, path: string): void {
  const existing = quest404Logs.find(
    (l) => l.questId === questId && l.path === path
  );
  const now = new Date().toISOString();
  if (existing) {
    existing.count += 1;
    existing.lastOccurred = now;
  } else {
    quest404Logs.push({ questId, path, count: 1, lastOccurred: now });
  }
}

