import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import { fetchBoards as fetchBoardsAPI, updateBoard } from '../api/board';
import type { BoardData } from '../types/boardTypes';
import type { GitFileNode, GitStatus } from '../types/gitTypes';

export interface BoardItem {
  id: string;
  gitStatus?: GitStatus;
  fileTree?: GitFileNode[];
  [key: string]: any;
}

export type BoardMap = Record<string, BoardData>;

export interface BoardContextType {
  boards: BoardMap;
  selectedBoard: string | null;
  setSelectedBoard: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  refreshBoards: () => Promise<void>;
  appendToBoard: (boardId: string, newItem: BoardItem) => void;
  updateBoardItem: (boardId: string, updatedItem: BoardItem) => void;
  removeItemFromBoard: (boardId: string, itemId: string) => void;
  setBoardMeta: (meta: { id: string; title: string; layout: string }) => void;
  updateBoardGitStatus: (boardId: string, status: GitStatus) => void;
  setBoardFileTree: (boardId: string, tree: GitFileNode[]) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [boards, setBoards] = useState<BoardMap>({});
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [boardMeta, setBoardMetaState] = useState<{ id: string; title: string; layout: string } | null>(null);

  const setBoardMeta = (meta: { id: string; title: string; layout: string }) => {
    setBoardMetaState(meta);
  };

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

  const convertToBoardData = (raw: any): BoardData => ({
    id: raw.id,
    title: raw.name || 'Untitled',
    createdAt: raw.createdAt || new Date().toISOString(),
    boardType: raw.boardType || 'post',
    layout: raw.layout as BoardData['layout'],
    items: (raw.enrichedItems || []).map((item: any) => item?.id ?? null),
  });

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
