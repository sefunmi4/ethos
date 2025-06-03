// types/boardTypes.ts

/** Supported board categories used for grouping items like posts or quests */
export type BoardType = 'post' | 'quest';

/** Supported board structures for organizing items */
export type BoardStructure = 'list' | 'tree' | 'graph';

/** Generic board interface shared across profile, quests, etc. */
export interface Board {
  id?: string;
  title: string;
  description?: string;
  type: BoardType;
  structure: BoardStructure;
  items: (string | null)[]; // item IDs (can be null if deleted)
  filters?: Record<string, any>;
  featured?: boolean;
  defaultFor?: 'home' | 'profile' | 'quests';
  createdAt: string;
}

/**
 * Enriched board format used when fetching detailed items
 */
export interface BoardData extends Board {
  enrichedItems?: any[]; // narrowed per board type in render logic
}