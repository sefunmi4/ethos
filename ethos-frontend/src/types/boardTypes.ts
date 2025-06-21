import type { User } from './userTypes';
import type { Post } from './postTypes';
import type { Quest } from './questTypes';
import type { Visibility, ItemType } from './common';

export type BoardType = 'post' | 'quest' | 'map' | 'log' | 'custom';

/** Generic board interface shared across profile, quests, etc. */
export interface Board {
  id: string;
  title: string;
  description?: string;
  boardType: BoardType;
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
  id?: string;
  title: string;
  description?: string;
  boardType: BoardType;
  layout: BoardLayout;
  items: string[];
  filters?: Record<string, any>;
  featured?: boolean;
  defaultFor?: 'home' | 'profile' | 'quests' | null;
  category?: string;
  questId?: string;
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

export type BoardLayout =
  | 'grid'
  | 'list'
  | 'horizontal'
  | 'kanban'
  | 'graph'
  | 'graph-condensed'
  | 'map-graph';


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
  /** Hide filter and sort controls */
  hideControls?: boolean;
  filter?: Record<string, any>;
  onScrollEnd?: () => void;
  loading?: boolean;
  quest?: Quest;
  /** Layout variant for GridLayout */
  gridLayout?: 'vertical' | 'horizontal' | 'kanban';
  /** Expand all posts when rendering nested replies */
  initialExpanded?: boolean;
}

/** Props for the EditBoard component */
export interface EditBoardProps {
  board: BoardData;
  onSave?: (updatedBoard: BoardData) => void;
  onCancel?: () => void;
  onDelete?: (boardId: string) => void;
}
