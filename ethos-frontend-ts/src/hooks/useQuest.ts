import { useEffect, useState, useCallback } from 'react';
import type { Quest, EnrichedQuest } from '../types/questTypes';
import type { Post } from '../types/postTypes';
import {
  getQuestById,
  getAllQuests,
  enrichQuestWithData,
  fetchQuestsByBoardId,
} from '../api/quest';

function isQuest(obj: any): obj is Quest {
  return (
    obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    'headPostId' in obj &&
    !('type' in obj || 'content' in obj) // Avoid Posts
  );
}

/**
 * Custom hook for quest-related data operations.
 */
export const useQuest = (questId?: string) => {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!questId);

  // Load a single quest by ID
  useEffect(() => {
    if (!questId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getQuestById(questId);
        setQuest(result);
      } catch (err) {
        setError('Failed to load quest');
        console.error('[useQuest] Failed to load quest by ID:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [questId]);

  const fetchQuestsForBoard = useCallback(async (boardId: string): Promise<Quest[]> => {
    try {
      return await fetchQuestsByBoardId(boardId);
    } catch (err) {
      console.error(`[useQuest] Failed to fetch quests for board: ${boardId}`, err);
      return [];
    }
  }, []);

  const fetchAllQuests = useCallback(async (): Promise<Quest[]> => {
    try {
      return await getAllQuests();
    } catch (err) {
      console.error('[useQuest] Failed to fetch all quests:', err);
      return [];
    }
  }, []);

  const enrichQuests = useCallback(
    async (items: (Quest | Post)[]): Promise<EnrichedQuest[]> => {
      try {
        const enriched = await Promise.all(
          items
            .filter(isQuest)
            .map((q) => enrichQuestWithData(q))
        );
        return enriched;
      } catch (err) {
        console.error('[useQuest] Failed to enrich quests:', err);
        return [];
      }
    },
    []
  );

  const getAllEnrichedQuests = useCallback(async (): Promise<EnrichedQuest[]> => {
    const all = await fetchAllQuests();
    return enrichQuests(all);
  }, [fetchAllQuests, enrichQuests]);

  return {
    quest,
    error,
    isLoading,
    fetchQuestsForBoard,
    fetchAllQuests,
    enrichQuests,
    getAllEnrichedQuests,
  };
};