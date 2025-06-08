import type { User } from './userTypes';
import type { Post } from './postTypes';
import type { Quest } from './questTypes';
import type { Visibility, ItemType } from './common';

/** Generic board interface shared across profile, quests, etc. */
export interface Board {
  id: string;
  title: string;
  description?: string;
  layout: BoardLayout;
  items: (string | null)[];
  filters?: Record<string, any>;
  featured?: boolean;
  defaultFor?: 'home' | 'profile' | 'quests';
  createdAt: string;
  category?: string;
  userId?: string; // 🔄 changed from required to optional
}

/**
 * Enriched board format used when fetching detailed items
 */
export interface BoardData extends Board {
  enrichedItems?: any[];       // hydrated post/quest objects
  questId?: string;            // Used to associate board with a quest, if relevant
}

/** Payload used when creating a new board */
export interface CreateBoardPayload {
  title: string;
  description?: string;
  layout: BoardLayout;
  items: string[];
  filters?: Record<string, any>;
  featured?: boolean;
  defaultFor?: 'home' | 'profile' | 'quests' | null;
  category?: string;
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

export type BoardItem = RenderableItem | Post | Quest | Board ;

export type BoardLayout = 'grid' | 'graph' | 'thread';


/** Props passed to the Board component */
export interface BoardProps {
  boardId?: string;
  board?: BoardData;
  layout?: BoardLayout;
  title?: string;
  user?: User;
  editable?: boolean;
  readOnly?: boolean;
  compact?: boolean;
  showCreate?: boolean;
  filter?: Record<string, any>;
  onScrollEnd?: () => void;
  loading?: boolean;
  quest?: Quest;
  /**
   * Hide filter and sorting controls in the board header.
   * Useful for compact or embedded boards where controls would be noisy.
   */

  hideControls?: boolean;
}

/** Props for the EditBoard component */
export interface EditBoardProps {
  board: BoardData;
  onSave?: (updatedBoard: BoardData) => void;
  onCancel?: () => void;
  onDelete?: (boardId: string) => void;
}
