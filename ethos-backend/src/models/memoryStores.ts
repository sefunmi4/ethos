import type { DBSchema } from '../types/db';
import type { DataStore } from '../types/db';

function createMemoryStore<T>(initial: T): DataStore<T> {
  let data = initial;
  return {
    read: () => data,
    write: (newData: T) => {
      data = newData;
    },
  };
}

export const boardsStore = createMemoryStore<DBSchema['boards']>([]);
export const gitStore = createMemoryStore<DBSchema['git']>([]);
export const postsStore = createMemoryStore<DBSchema['posts']>([]);
export const questsStore = createMemoryStore<DBSchema['quests']>([]);
export const projectsStore = createMemoryStore<DBSchema['projects']>([]);
export const usersStore = createMemoryStore<DBSchema['users']>([]);
export const reactionsStore = createMemoryStore<DBSchema['reactions']>([]);
export const reviewsStore = createMemoryStore<DBSchema['reviews']>([]);
export const boardLogsStore = createMemoryStore<DBSchema['boardLogs']>([]);
export const notificationsStore = createMemoryStore<DBSchema['notifications']>([]);
export const joinRequestsStore = createMemoryStore<DBSchema['joinRequests']>([]);
