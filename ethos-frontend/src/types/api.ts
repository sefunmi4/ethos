// Central API types re-exported for convenience

import type { Post } from './postTypes';
import type { Quest } from './questTypes';
import type { Board, RenderableItem } from './boardTypes';

export * from './boardTypes';
export * from './questTypes';
export * from './postTypes';
export * from './userTypes';
export * from './gitTypes';
export * from './common';

export type UUID = string;
export type Timestamp = string;

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export type AppItem = Post | Quest | Board | RenderableItem;
