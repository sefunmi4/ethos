import type { User } from './userTypes';
import type { Quest } from './questTypes';

/** Supported board categories used for grouping items like posts, quests, maps, or logs */
export type BoardType = 'post' | 'quest' | 'map' | 'log' | 'custom';

/** Supported board structures for organizing items */
export type BoardStructure = 'grid' | 'graph' | 'thread';

/** Git metadata attached to boards or items */
export interface GitStatus {
  branch?: string;
  ahead?: number;
  behind?: number;
  isDirty?: boolean;
}

export interface GitFileNode {
  path: string;
  type: 'file' | 'dir';
  children?: GitFileNode[];
}

/** Generic board interface shared across profile, quests, etc. */
export interface Board {
  id: string;
  title: string;
  description?: string;
  type: BoardType;
  structure: BoardStructure;
  items: (string | null)[]; // item IDs (can be null if deleted)
  filters?: Record<string, any>; // e.g., { visibility: 'public' }
  featured?: boolean;
  defaultFor?: 'home' | 'profile' | 'quests';
  createdAt: string;
  category?: string; // Optional board grouping

  // Git metadata
  gitRepoUrl?: string;
  repoStatus?: GitStatus;
  repoTree?: GitFileNode[];
}

/**
 * Enriched board format used when fetching detailed items
 */
export interface BoardData extends Board {
  enrichedItems?: any[];       // hydrated post/quest objects
  questId?: string;            // Used to associate board with a quest, if relevant
  userId?: string;             // (optional) used for permission checks
}

/** Props passed to the Board component */
export interface BoardProps {
  boardId?: string;
  board?: BoardData;
  structure?: BoardStructure;
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
}

/** Props for the EditBoard component */
export interface EditBoardProps {
  board: BoardData;
  onSave?: (updatedBoard: BoardData) => void;
  onCancel?: () => void;
  onDelete?: (boardId: string) => void;
}
