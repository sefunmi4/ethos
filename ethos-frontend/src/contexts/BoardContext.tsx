import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import { fetchBoards as fetchBoardsAPI, updateBoard } from '../api/board';
import type { BoardData } from '../types/boardTypes';
import type {
  BoardItem,
  BoardMap,
  BoardContextType,
} from './BoardContextTypes';
import type { GitFileNode, GitStatus } from '../types/gitTypes';

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [boards, setBoards] = useState<BoardMap>({});
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setBoardMetaState] = useState<{ id: string; title: string; layout: string } | null>(null);
  const EXPANDED_KEY = 'ethos.expandedItem';
  const [expandedItemId, setExpandedItemId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(EXPANDED_KEY) || null;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (expandedItemId) {
      localStorage.setItem(EXPANDED_KEY, expandedItemId);
    } else {
      localStorage.removeItem(EXPANDED_KEY);
    }
  }, [expandedItemId]);

  const setBoardMeta = useCallback(
    (meta: { id: string; title: string; layout: string }) => {
      setBoardMetaState(meta);
    },
    []
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const { task } = (e as CustomEvent<{ task: BoardItem }>).detail;
      setBoards(prev => {
        const updated: BoardMap = { ...prev };
        Object.keys(updated).forEach(id => {
          if (updated[id]?.enrichedItems?.some(it => it.id === task.id)) {
            updated[id] = {
              ...updated[id],
              enrichedItems: updated[id].enrichedItems!.map(it =>
                it.id === task.id ? task : it
              ),
            };
          }
        });
        return updated;
      });
    };
    window.addEventListener('taskUpdated', handler);
    return () => window.removeEventListener('taskUpdated', handler);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const loadBoards = async () => {
      setLoading(true);
      try {
        const boardList = await fetchBoardsAPI({ userId: user?.id, enrich: true });
        const boardMap: BoardMap = {};
        boardList.forEach((b: BoardData) => {
          boardMap[b.id] = b;
        });

        setBoards(boardMap);
        setSelectedBoard(boardList[0]?.id || null);
      } catch (err) {
        console.error('[BoardContext] Failed to load boards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBoards();
  }, [user, authLoading]);

  const appendToBoard = (boardId: string, newItem: BoardItem) => {
    setBoards((prev) => {
      const current = prev[boardId] || ({} as BoardData);
      const existingIds = new Set(current.items || []);
      existingIds.delete(newItem.id);
      const updatedItems = [newItem.id, ...Array.from(existingIds)];

      updateBoard(boardId, { items: updatedItems }).catch((err) =>
        console.error('[BoardContext] Failed to persist board items:', err)
      );

      const existingEnriched = (current.enrichedItems || []).filter(
        (it) => it.id !== newItem.id
      );

      return {
        ...prev,
        [boardId]: {
          ...current,
          items: updatedItems,
          enrichedItems: [newItem, ...existingEnriched],
        },
      };
    });
  };

  const updateBoardItem = (boardId: string, updatedItem: BoardItem) => {
    setBoards((prev) => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        enrichedItems: (prev[boardId]?.enrichedItems || []).map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        ),
      },
    }));
  };

  const removeItemFromBoard = (boardId: string, itemId: string) => {
    setBoards((prev) => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        enrichedItems: (prev[boardId]?.enrichedItems || []).filter(
          (item) => item.id !== itemId
        ),
      },
    }));
  };

  const updateBoardGitStatus = (boardId: string, status: GitStatus) => {
    setBoards((prev) => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        repoStatus: status,
      },
    }));
  };

  const setBoardFileTree = (boardId: string, tree: GitFileNode[]) => {
    setBoards((prev) => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        repoTree: tree,
      },
    }));
  };

  const refreshBoards = async () => {
    if (!user) return;
    try {
      const boardList = await fetchBoardsAPI({ userId: user.id, enrich: true });
      const boardMap: BoardMap = {};
      boardList.forEach((b: BoardData) => {
        boardMap[b.id] = b;
      });
      setBoards(boardMap);
    } catch (err) {
      console.error('[BoardContext] Failed to refresh boards:', err);
    }
  };

  const value: BoardContextType = {
    boards,
    selectedBoard,
    setSelectedBoard,
    loading,
    refreshBoards,
    appendToBoard,
    updateBoardItem,
    removeItemFromBoard,
    setBoardMeta,
    updateBoardGitStatus,
    setBoardFileTree,
    expandedItemId,
    setExpandedItemId,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export const useBoardContext = (): BoardContextType => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
};

export const useBoardContextEnhanced = () => {
  const context = useBoardContext();

  const convertToBoardData = (raw: unknown): BoardData => {
    const r = raw as Record<string, unknown>;
    return {
      id: r.id,
      title: r.name || 'Untitled',
      createdAt: r.createdAt || new Date().toISOString(),
      boardType: r.boardType || 'post',
      layout: r.layout as BoardData['layout'],
      items: (r.enrichedItems || []).map((item: unknown) => (item as { id?: string }).id ?? null),
    };
  };

  const userQuestBoard = useMemo<BoardData | undefined>(() => {
    const found = Object.values(context.boards).find((b) =>
      b.enrichedItems?.some((item) => item.type === 'quest')
    );
    return found ? convertToBoardData(found) : undefined;
  }, [context.boards]);

  const userPostBoard = useMemo<BoardData | undefined>(() => {
    const found = Object.values(context.boards).find((b) =>
      b.enrichedItems?.some((item) => item.type === 'post')
    );
    return found ? convertToBoardData(found) : undefined;
  }, [context.boards]);

  return {
    ...context,
    userQuestBoard,
    userPostBoard,
  };
};

