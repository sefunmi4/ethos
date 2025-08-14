
// src/models/GitModel.ts
import type { DBSchema } from '../types/db';
import { createDataStore } from '../utils/loaders';
import { DEFAULT_BOARDS } from '../data/boardContextDefaults';

export const boardsStore = createDataStore<DBSchema['boards']>('boards.json', DEFAULT_BOARDS);
export const gitStore = createDataStore<DBSchema['git']>('git.json', []);
export const postsStore = createDataStore<DBSchema['posts']>('posts.json', []);
export const questsStore = createDataStore<DBSchema['quests']>('quests.json', []);
export const projectsStore = createDataStore<DBSchema['projects']>('projects.json', []);
export const usersStore = createDataStore<DBSchema['users']>('users.json', []);
export const reactionsStore = createDataStore<string[]>('reactions.json', []);
export const boardLogsStore = createDataStore<DBSchema['boardLogs']>('boardLogs.json', []);
export const notificationsStore = createDataStore<DBSchema['notifications']>('notifications.json', []);
