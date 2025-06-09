// src/utils/boardUtils.ts
import type { BoardData } from '../types/boardTypes';
import type { Post } from '../types/postTypes';
import type { Quest } from '../types/questTypes';

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
  items: Array<string | Post | Quest | null>
): BoardData => {
  const itemIds = items.map((item) => {
    if (item && typeof item === 'object') {
      return item.id;
    }
    return item as string | null;
  });

  return {
    id,
    title,
    layout: 'grid',
    items: itemIds,
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

/**
 * Filter and deduplicate board items before rendering.
 * - Removes duplicate IDs
 * - Hides posts linked to quests that already appear on the board
 */
export const getRenderableBoardItems = (
  items: Array<any>
): Array<any> => {
  const seen = new Set<string>();
  const questIds = new Set<string>();
  items.forEach((item) => {
    if ('headPostId' in item) {
      questIds.add(item.id);
    }
  });

  const result: any[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);

    if (!('headPostId' in item)) {
      const questId = item.questId;
      const linkedQuest = item.linkedItems?.find(
        (l: any) => l.itemType === 'quest' && questIds.has(l.itemId)
      );
      if ((questId && questIds.has(questId)) || linkedQuest) {
        continue;
      }
    }

    result.push(item);
  }
  return result;
};