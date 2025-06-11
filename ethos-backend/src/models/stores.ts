
// src/models/GitModel.ts
import type { DBSchema } from '../types/db';
import { createDataStore } from '../utils/loaders';

export const boardsStore = createDataStore<DBSchema['boards']>('boards.json', []);
export const gitStore = createDataStore<DBSchema['git']>('git.json', []);
export const postsStore = createDataStore<DBSchema['posts']>('posts.json', []);
export const questsStore = createDataStore<DBSchema['quests']>('quests.json', []);
export const usersStore = createDataStore<DBSchema['users']>('users.json', []);
export const reactionsStore = createDataStore<string[]>('reactions.json', []);
export const reviewsStore = createDataStore<DBSchema['reviews']>('reviews.json', []);
