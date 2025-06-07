import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBoardContext } from '../contexts/BoardContext';
import { fetchBoards, fetchBoard } from '../api/board';
import type { BoardData } from '../types/boardTypes';

type BoardArg = string | { questId: string; type: string; enrich?: boolean };

const getBoardIdFromArg = (arg: BoardArg): string => {
  if (typeof arg === 'string') return arg;
  return `${arg.type}-${arg.questId}`;
};

/**
 * Hook to interact with the board system (load, refresh, manage).
 */
export const useBoard = (arg?: BoardArg) => {
  const {
    boards = {},
    setSelectedBoard,
    appendToBoard,
    removeItemFromBoard,
  } = useBoardContext(); // ✅ useBoardContext instead of BoardContext

  const boardId = useMemo(() => (arg ? getBoardIdFromArg(arg) : undefined), [arg]);

  const [board, setBoard] = useState<BoardData | undefined>(
    boardId ? boards[boardId] : undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadBoard = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const enrich = typeof arg === 'object' && arg.enrich;
      const result = await fetchBoard(id, enrich ? { enrich: true } : {});
      setBoard(result);
      return result;
    } catch (err) {
      console.error(`[useBoard] Failed to load board ${id}:`, err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [arg]);

  const refresh = useCallback(async () => {
    if (!boardId) return;
    return await loadBoard(boardId);
  }, [boardId, loadBoard]);

  const fetchAllBoards = useCallback(async (userId?: string) => {
    try {
      const list = await fetchBoards(userId); // ⬅ pass to actual API call
      return list;
    } catch (err) {
      console.error('[useBoard] Failed to fetch all boards:', err);
      return [];
    }
  }, []);

  const loadPublicBoards = useCallback(async (userId: string) => {
    const [quests, posts] = await Promise.all([
      fetchBoard(`quests-${userId}`, { enrich: true }).catch(() => null),
      fetchBoard(`posts-${userId}`, { enrich: true }).catch(() => null),
    ]);
    return {
      profile: { id: userId },
      quests: quests as BoardData,
      posts: posts as BoardData,
    };
  }, []);

  // Auto-load if missing
  useEffect(() => {
    if (boardId && !board) {
      loadBoard(boardId);
    }
  }, [boardId]);

  return {
    board,
    setBoard,
    isLoading,
    loadBoard,
    refresh,
    fetchBoards: fetchAllBoards,
    loadPublicBoards,
    setSelectedBoard,
    appendToBoard,
    removeItemFromBoard,
  };
};