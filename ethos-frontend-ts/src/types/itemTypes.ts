import type { Visibility } from './common';
import type { Post } from './postTypes';
import type { Quest } from './questTypes';
import type { Board } from './boardTypes';

export type ItemType = 'post' | 'quest' | 'board' | 'project'; // extensible

export type AppItem = Post | Quest | Board | RenderableItem;

export type LinkType = 'related' | 'solution' | 'duplicate' | 'quote' | 'reference';
export type LinkStatus = 'active' | 'solved' | 'private' | 'pending';

export interface LinkedItem {
  itemId: string;
  itemType: ItemType;
  nodeId?: string;
  title?: string;
  linkType?: LinkType;
  linkStatus?: LinkStatus;
  notifyOnChange?: boolean;     // Triggers alert if updated
  cascadeSolution?: boolean;   // Triggers downstream propagation
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