import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import { fetchBoards as fetchBoardsAPI } from '../api/board';
import type { BoardData, GitFileNode, GitStatus } from '../types/boardTypes';

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
  const { user } = useAuth();

  const [boards, setBoards] = useState<BoardMap>({});
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [boardMeta, setBoardMetaState] = useState<{ id: string; title: string; layout: string } | null>(null);

  const setBoardMeta = (meta: { id: string; title: string; layout: string }) => {
    setBoardMetaState(meta);
  };

  useEffect(() => {
    const loadBoards = async () => {
      setLoading(true);
      try {
        const boardList = await fetchBoardsAPI(user?.id);
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
      const boardList = await fetchBoardsAPI(user.id);
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

  const convertToBoardData = (raw: any, type: 'quest' | 'post'): BoardData => ({
    id: raw.id,
    title: raw.name || 'Untitled',
    type,
    createdAt: raw.createdAt || new Date().toISOString(),
    structure: raw.structure as BoardData['structure'],
    items: (raw.enrichedItems || []).map((item: any) => item?.id ?? null),
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
