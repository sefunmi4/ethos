import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
} from 'react';
import { axiosWithAuth } from '../utils/authUtils';
import { useAuth } from './AuthContext';
import type { Post } from '../types/postTypes'; // replace with your actual types
import type { Quest } from '../types/questTypes';
import type { BoardData } from '../types/boardTypes'; // update import if needed


/**
 * Represents an item within a board.
 */
export interface BoardItem {
  id: string;
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
  removeFromBoard: (boardId: string, itemId: string) => void;
  setBoardMeta: (meta: { id: string; title: string; layout: string }) => void;
}

// Create context
const BoardContext = createContext<BoardContextType | undefined>(undefined);

/**
 * Provider that loads boards and exposes board manipulation functions.
 */
export const BoardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [boards, setBoards] = useState<BoardMap>({});
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [boardMeta, setBoardMetaState] = useState<{ id: string; title: string; layout: string } | null>(null);

  const setBoardMeta = (meta: { id: string; title: string; layout: string }) => {
    setBoardMetaState(meta);
  };

  // Load user or guest boards on mount
  useEffect(() => {
    const loadBoards = async () => {
      setLoading(true);
      try {
        const res = user
          ? await axiosWithAuth.get('/boards?userBoards=true')
          : await axiosWithAuth.get('/boards?guestBoards=true');

        const boardMap: BoardMap = {};
        res.data.forEach((b: BoardData) => {
          boardMap[b.id] = b;
        });

        setBoards(boardMap);
        setSelectedBoard(res.data[0]?.id || null);
      } catch (err) {
        console.error('[BoardContext] Failed to load boards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBoards();
  }, [user]);

  const appendToBoard = (boardId: string, newItem: BoardItem) => {
    setBoards((prev) => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        enrichedItems: [newItem, ...(prev[boardId]?.enrichedItems || [])],
      },
    }));
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

  const removeFromBoard = (boardId: string, itemId: string) => {
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

  const refreshBoards = async () => {
    if (!user) return;
    try {
      const res = await axiosWithAuth.get('/boards?userBoards=true');
      const boardMap: BoardMap = {};
      res.data.forEach((b: BoardData) => {
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
    removeFromBoard,
    setBoardMeta,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

/**
 * Safely consumes the BoardContext.
 */
export const useBoardContext = (): BoardContextType => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
};

/**
 * Enhanced hook that returns board objects directly for userQuestBoard and userPostBoard
 */
export const useBoardContextEnhanced = () => {
  const context = useBoardContext();

  const convertToBoardData = (raw: any, type: 'quest' | 'post'): BoardData => ({
    id: raw.id,
    title: raw.name || 'Untitled',
    type,
    createdAt: raw.createdAt || new Date().toISOString(),
    structure: raw.structure as BoardData['structure'],
    items: (raw.enrichedItems || []).map((item: any) => item?.id ?? null), // ✅ fixed
  });

  const userQuestBoard = useMemo<BoardData | undefined>(() => {
    const found = Object.values(context.boards).find((b) =>
      b.enrichedItems?.some((item) => item.type === 'quest')
    );
    return found ? convertToBoardData(found, 'quest') : undefined;
  }, [context.boards]);

  const userPostBoard = useMemo<BoardData | undefined>(() => {
    const found = Object.values(context.boards).find((b) =>
      b.enrichedItems?.some((item) => item.type === 'post')
    );
    return found ? convertToBoardData(found, 'post') : undefined;
  }, [context.boards]);

  return {
    ...context,
    userQuestBoard,
    userPostBoard,
  };
};