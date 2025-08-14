
// src/models/GitModel.ts
import type {
  DBBoard,
  DBGitRepo,
  DBPost,
  DBQuest,
  DBProject,
  DBUser,
  DBReview,
  DBBoardLog,
  DBNotification,
} from '../types/db';
import { createDataStore } from '../utils/loaders';
import { DEFAULT_BOARDS } from '../data/boardContextDefaults';

export const boardsStore = createDataStore<DBBoard[]>('boards.json', DEFAULT_BOARDS);
export const gitStore = createDataStore<DBGitRepo[]>('git.json', []);
export const postsStore = createDataStore<DBPost[]>('posts.json', []);
export const questsStore = createDataStore<DBQuest[]>('quests.json', []);
export const projectsStore = createDataStore<DBProject[]>('projects.json', []);
export const usersStore = createDataStore<DBUser[]>('users.json', []);
export const reactionsStore = createDataStore<string[]>('reactions.json', []);
export const reviewsStore = createDataStore<DBReview[]>('reviews.json', []);
export const boardLogsStore = createDataStore<DBBoardLog[]>('boardLogs.json', []);
export const notificationsStore = createDataStore<DBNotification[]>('notifications.json', []);
