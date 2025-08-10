// src/utils/boardUtils.ts
import type { BoardData, BoardItem } from '../types/boardTypes';
import type { Post, LinkedItem } from '../types/postTypes';
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
  items: Array<string | Post | Quest | null>,
  boardType: BoardData['boardType'] = 'post'
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
    boardType,
    layout: 'grid',
    items: itemIds,
    enrichedItems: items.filter(
      (it): it is Post | Quest => typeof it === 'object' && it !== null
    ),
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
  items: Array<BoardItem>
): Array<BoardItem> => {
  const seen = new Set<string>();
  const questIds = new Set<string>();
  items.forEach((item) => {
    if (item && typeof item === 'object' && 'headPostId' in item) {
      questIds.add(item.id);
    }
  });

  const result: BoardItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);

    if (!('headPostId' in item)) {
      const post = item as Post;
      // Allow request posts to always render even if a linked quest is present
      if (post.type !== 'request') {
        const questId = post.questId;
        const linkedQuest = post.linkedItems?.find(
          (l: LinkedItem) => l.itemType === 'quest' && questIds.has(l.itemId)
        );
        if ((questId && questIds.has(questId)) || linkedQuest) {
          continue;
        }
      }
    }

    result.push(item);
  }
  return result;
};