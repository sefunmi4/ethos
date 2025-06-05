
// src/models/GitModel.ts

export interface GitRepoMeta {
  repoName: string;
  repoUrl: string;
  contributors?: string[];
  commits?: number;
  latestCommitDate?: string;
}
  
import { JsonStore } from '../utils/loaders';
import { User, Post, Quest, Board } from '../types/api';

export const usersStore = new JsonStore<User>('src/data/users.json');
export const postsStore = new JsonStore<Post>('src/data/posts.json');
export const questsStore = new JsonStore<Quest>('src/data/quests.json');
export const boardsStore = new JsonStore<Board>('src/data/boards.json');
export const GitStore = new JsonStore<GitRepoMeta>('gitMeta.json');
