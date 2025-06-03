import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { axiosWithAuth } from '../utils/authUtils';
import { useAuth } from './AuthContext';
  
/**
 * Represents an item within a board's enrichedItems array.
 */
export interface BoardItem {
  id: string;
  [key: string]: any;
}
  
/**
 * Represents a board returned from the API.
 */
export interface Board {
  id: string;
  name?: string;
  enrichedItems?: BoardItem[];
  [key: string]: any;
}

/**
 * A dictionary of boards indexed by board ID.
 */
export type BoardMap = Record<string, Board>;

/**
 * Shape of the BoardContext value.
 */
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

// Create context with undefined default to force use inside provider
const BoardContext = createContext<BoardContextType | undefined>(undefined);

/**
 * Provider component to supply board state and actions to children.
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

  /**
   * Load boards from API based on user authentication status.
   */
  useEffect(() => {
    const loadBoards = async () => {
      setLoading(true);
      try {
        const res = user
          ? await axiosWithAuth.get('/boards?userBoards=true')
          : await axiosWithAuth.get('/boards?guestBoards=true');

        const boardMap: BoardMap = {};
        res.data.forEach((b: Board) => {
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

  /**
   * Add a new item to the top of a board's item list.
   */
  const appendToBoard = (boardId: string, newItem: BoardItem) => {
    setBoards((prev) => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        enrichedItems: [newItem, ...(prev[boardId]?.enrichedItems || [])],
      },
    }));
  };

  /**
   * Replace a board item by ID.
   */
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

  /**
   * Remove a board item by ID.
   */
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

  /**
   * Re-fetch boards from the server.
   */
  const refreshBoards = async () => {
    if (!user) return;
    try {
      const res = await axiosWithAuth.get('/boards?userBoards=true');
      const boardMap: BoardMap = {};
      res.data.forEach((b: Board) => {
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
    setBoardMeta, // ✅ now available to consumers
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

/**
 * Hook to safely consume the BoardContext.
 * Throws if used outside the BoardProvider.
 */
export const useBoardContext = (): BoardContextType => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
};