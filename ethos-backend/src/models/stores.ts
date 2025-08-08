
// src/models/GitModel.ts
import type { DBSchema } from '../types/db';
import { createDataStore } from '../utils/loaders';
import { NEW_USER_BOARD_CONTEXT } from '../data/boardContextDefaults';

export const boardsStore = createDataStore<DBSchema['boards']>('boards.json', NEW_USER_BOARD_CONTEXT);
export const gitStore = createDataStore<DBSchema['git']>('git.json', []);
export const postsStore = createDataStore<DBSchema['posts']>('posts.json', []);
export const questsStore = createDataStore<DBSchema['quests']>('quests.json', []);
export const projectsStore = createDataStore<DBSchema['projects']>('projects.json', []);
export const usersStore = createDataStore<DBSchema['users']>('users.json', []);
export const reactionsStore = createDataStore<string[]>('reactions.json', []);
export const reviewsStore = createDataStore<DBSchema['reviews']>('reviews.json', []);
export const boardLogsStore = createDataStore<DBSchema['boardLogs']>('boardLogs.json', []);
export const notificationsStore = createDataStore<DBSchema['notifications']>('notifications.json', []);
