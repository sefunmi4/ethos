// options.ts
import type { BoardLayout } from '../types/boardTypes';
import type { PostType } from '../types/postTypes';

export const STRUCTURE_OPTIONS: { value: BoardLayout; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'graph', label: 'Graph' },
  { value: 'graph-condensed', label: 'Graph (Condensed)' },
  { value: 'thread', label: 'Thread' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
] as const;

export const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'free_speech', label: 'Free Speech' },
  { value: 'request', label: 'Request' },
  { value: 'quest', label: 'Quest' },
  { value: 'task', label: 'Quest Task' },
  { value: 'log', label: 'Quest Log' },
  { value: 'commit', label: 'Commit' },
  { value: 'issue', label: 'Issue' },
];

export const LINK_TYPES = ['solution', 'duplicate', 'citation'];

export const STATUS_OPTIONS = [
  { value: 'To Do', label: 'To Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Blocked', label: 'Blocked' },
  { value: 'Done', label: 'Done' },
] as const;

/**
 * Defines the shape of each select option.
 */
export interface option {
  value: string;
  label: string;
  disabled?: boolean; // ✅ Add this line
}
