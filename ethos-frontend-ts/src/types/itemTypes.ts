import type { Visibility } from './common';
import type { Post } from './postTypes';
import type { Quest } from './questTypes';
import type { Board } from './boardTypes';

export type ItemType = 'post' | 'quest' | 'board' | 'project'; // extensible

export type AppItem = Post | Quest | Board | RenderableItem;

export interface LinkedItem {
  itemId: string;
  itemType: ItemType;
  nodeId?: string;
  title?: string;
}

export interface RenderableItem {
    id: string;
    type: ItemType;
    title?: string;
    content?: string;
    status?: string;
    authorId?: string;
    visibility?: Visibility;
    tags?: string[];
    enriched?: boolean;
    // You can safely add more based on shared fields
  }