import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBoardContext } from '../contexts/BoardContext';
import { fetchBoards, fetchBoard } from '../api/board';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_PAGE_SIZE } from '../constants/pagination';
import { fetchUserById } from '../api/auth';
import { fetchQuestsByBoardId } from '../api/quest';
import { fetchPostsByBoardId } from '../api/post';
import type { BoardData } from '../types/boardTypes';
import type { User } from '../types/userTypes';

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
  const { user } = useAuth();

  const boardId = useMemo(() => (arg ? getBoardIdFromArg(arg) : undefined), [arg]);

  const [board, setBoard] = useState<BoardData | undefined>(
    boardId ? boards[boardId] : undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadBoard = useCallback(
    async (id: string, page = 1, limit = DEFAULT_PAGE_SIZE) => {
      setIsLoading(true);
      try {
        const enrich = typeof arg === 'object' && arg.enrich;
        const result = await fetchBoard(id, {
          enrich,
          page,
          limit,
          userId: user?.id,
        });
        setBoard(result);
        return result;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          console.info(`[useBoard] Board ${id} not found`);
        } else {
          console.error(`[useBoard] Failed to load board ${id}:`, err);
        }
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [arg]
  );

  const refresh = useCallback(async () => {
    if (!boardId) return;
    return await loadBoard(boardId, 1, DEFAULT_PAGE_SIZE);
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
      const [questBoard, postBoard, profileRes, quests, posts] = await Promise.all([
        fetchBoard(`quests-${userId}`, { userId }).catch(() => null),
        fetchBoard(`posts-${userId}`, { userId }).catch(() => null),
        fetchUserById(userId).catch(() => null), // ✅ Use the API
        fetchQuestsByBoardId(`quests-${userId}`, userId).catch(() => []),
        fetchPostsByBoardId(`posts-${userId}`, userId).catch(() => []),
      ]);

    const qb: BoardData = questBoard
      ? { ...questBoard, items: quests.map(q => q.id), enrichedItems: quests }
      : {
          id: `quests-${userId}`,
          title: 'Quests',
          layout: 'grid',
          items: quests.map(q => q.id),
          createdAt: '',
          userId,
          enrichedItems: quests,
        };
    const pb: BoardData = postBoard
      ? { ...postBoard, items: posts.map(p => p.id), enrichedItems: posts }
      : {
          id: `posts-${userId}`,
          title: 'Posts',
          layout: 'grid',
          items: posts.map(p => p.id),
          createdAt: '',
          userId,
          enrichedItems: posts,
        };

    return {
      profile: profileRes as User,
      quests: qb,
      posts: pb,
    };
  }, []);

  // Auto-load if missing
  useEffect(() => {
    if (boardId && !board) {
      loadBoard(boardId, 1, DEFAULT_PAGE_SIZE);
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