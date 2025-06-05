import { useEffect, useState, useCallback } from 'react';
import type { Quest, EnrichedQuest } from '../types/questTypes';
import type { Post } from '../types/postTypes';
import {
  fetchQuestsByBoardId,
  fetchQuestById,
  enrichQuestWithData,
} from '../api/quest';

/**
 * Custom hook for quest-related data operations.
 *
 * Provides:
 * - Quest list operations (fetch + enrich)
 * - Single quest loader (with error/loading state)
 */
export const useQuest = (questId?: string) => {
  // Single quest loading state
  const [quest, setQuest] = useState<Quest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!questId);

  // Load a single quest by ID if questId is passed in
  useEffect(() => {
    if (!questId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchQuestById(questId);
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

  /**
   * Fetches all quests for a specific board by ID.
   */
  const fetchQuestsForBoard = useCallback(async (boardId: string): Promise<Quest[]> => {
    try {
      return await fetchQuestsByBoardId(boardId);
    } catch (err) {
      console.error(`[useQuest] Failed to fetch quests for board: ${boardId}`, err);
      return [];
    }
  }, []);

  /**
   * Enriches an array of raw quests with computed metadata (progress, relationships, etc.)
   */
  const enrichQuests = useCallback(
    async (quests: (Quest | Post)[]): Promise<EnrichedQuest[]> => {
      try {
        const enriched = await Promise.all(
          quests
            .filter((q): q is Quest => q && q.type === 'quest')
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

  return {
    quest,
    error,
    isLoading,
    fetchQuestsForBoard,
    enrichQuests,
  };
};