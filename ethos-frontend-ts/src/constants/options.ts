// options.ts
import type { BoardStructure } from '../types/boardTypes';
import type { PostType } from '../types/postTypes';

export const STRUCTURE_OPTIONS: { value: BoardStructure; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'graph', label: 'Graph' },
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
];

/**
 * Defines the shape of each select option.
 */
export interface option {
  value: string;
  label: string;
}