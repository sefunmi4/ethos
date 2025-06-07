// src/utils/boardUtils.ts
import type { BoardData } from '../types/boardTypes';

/**
 * Creates a mock BoardData object for temporary or display-only purposes.
 * Useful for rendering a placeholder or preview board with lightweight item references.
 *
 * @param id - Unique identifier for the board.
 * @param title - Title to display on the board.
 * @param items - Array of item IDs or null values (e.g., post or quest IDs).
 * @returns A BoardData object that conforms to the expected schema.
 */
export const createMockBoard = (
  id: string,
  title: string,
  items: (string | null)[]
): BoardData => {
  return {
    id,
    title,
    layout: 'grid',
    items,
    enrichedItems: items,
    createdAt: new Date().toISOString(),
  };
};

export const getBoardIdFromParams = (
  input: string | { questId: string; type: string; enrich?: boolean }
): string => {
  if (typeof input === 'string') return input;
  const { questId, type } = input;
  return `${type}-${questId}`;
};