// options.ts
import type { BoardLayout, BoardType } from '../types/boardTypes';
import type { PostType } from '../types/postTypes';

export const STRUCTURE_OPTIONS: { value: BoardLayout; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'kanban', label: 'Kanban' },
  { value: 'graph', label: 'Graph' },
  { value: 'graph-condensed', label: 'Graph (Condensed)' },
  { value: 'map-graph', label: 'Map Graph' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
] as const;

export const BOARD_TYPE_OPTIONS: { value: BoardType; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'quest', label: 'Quest' },
  { value: 'map', label: 'Map' },
  { value: 'log', label: 'Log' },
  { value: 'custom', label: 'Custom' },
];

export const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'free_speech', label: 'Free Speech' },
  { value: 'request', label: 'Request' },
  { value: 'quest', label: 'Quest' },
  { value: 'task', label: 'Quest Task' },
  { value: 'log', label: 'Quest Log' },
  { value: 'commit', label: 'Commit' },
  { value: 'issue', label: 'Issue' },
  { value: 'review', label: 'Review' },
];

export const LINK_TYPES = ['solution', 'duplicate', 'citation'];

export const STATUS_OPTIONS = [
  { value: 'To Do', label: 'To Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Blocked', label: 'Blocked' },
  { value: 'Done', label: 'Done' },
] as const;

export const TASK_TYPE_OPTIONS = [
  { value: 'abstract', label: 'Planner' },
  { value: 'file', label: 'File' },
  { value: 'folder', label: 'Folder' },
] as const;

/**
 * Defines the shape of each select option.
 */
export interface option {
  value: string;
  label: string;
  disabled?: boolean; // ✅ Add this line
}
