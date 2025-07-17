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
export const useBoard = (
  arg?: BoardArg,
  options?: { pageSize?: number }
) => {
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

  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  const loadBoard = useCallback(
    async (id: string, page = 1, limit = pageSize) => {
      setIsLoading(true);
      try {
        const enrich = typeof arg === 'object' ? !!arg.enrich : true;
        const result = await fetchBoard(id, {
          enrich,
          page,
          limit,
          userId: user?.id,
        });
        setBoard(result);
        return result;
        } catch (err: unknown) {
          if ((err as { response?: { status?: number } })?.response?.status === 404) {
          console.info(`[useBoard] Board ${id} not found`);
        } else {
          console.error(`[useBoard] Failed to load board ${id}:`, err);
        }
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [arg, pageSize]
  );

  const refresh = useCallback(async () => {
    if (!boardId) return;
    return await loadBoard(boardId, 1, pageSize);
  }, [boardId, loadBoard, pageSize]);

  const fetchAllBoards = useCallback(async (userId?: string) => {
    try {
      const list = await fetchBoards({ userId, enrich: true });
      return list;
    } catch (err) {
      console.error('[useBoard] Failed to fetch all boards:', err);
      return [];
    }
  }, []);

  const loadPublicBoards = useCallback(async (userId: string) => {
      const [questBoard, postBoard, profileRes, quests, posts] = await Promise.all([
        fetchBoard('my-quests', { userId }).catch(() => null),
        fetchBoard('my-posts', { userId }).catch(() => null),
        fetchUserById(userId).catch(() => null), // ✅ Use the API
        fetchQuestsByBoardId('my-quests', userId).catch(() => []),
        fetchPostsByBoardId('my-posts', userId).catch(() => []),
      ]);

    const qb: BoardData = questBoard
      ? { ...questBoard, items: quests.map(q => q.id), enrichedItems: quests }
      : {
          id: 'my-quests',
          title: 'Quests',
          boardType: 'quest',
          layout: 'grid',
          items: quests.map(q => q.id),
          createdAt: '',
          userId,
          enrichedItems: quests,
        };
    const pb: BoardData = postBoard
      ? { ...postBoard, items: posts.map(p => p.id), enrichedItems: posts }
      : {
          id: 'my-posts',
          title: 'Posts',
          boardType: 'post',
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
      loadBoard(boardId, 1, pageSize);
    }
  }, [boardId, pageSize]);

  // Keep local board state in sync with context
  useEffect(() => {
    if (!boardId) return;
    const ctxBoard = boards[boardId];
    if (ctxBoard && ctxBoard !== board) {
      setBoard(ctxBoard);
    }
  }, [boards, boardId]);

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