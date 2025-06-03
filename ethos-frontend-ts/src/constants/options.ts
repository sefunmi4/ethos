// options.ts
import type { BoardStructure } from '../types/boardTypes';

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

/**
 * Defines the shape of each select option.
 */
export interface option {
  value: string;
  label: string;
}