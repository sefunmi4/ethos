import { useCallback, useContext, useState } from 'react';
import { BoardContext } from '../contexts/BoardContext';
import { BoardData } from '../types/boardTypes';
import {
  fetchBoards as apiFetchBoards,
  fetchBoardById,
  fetchPublicBoards,
} from '../api/board';

/**
 * Hook for managing and accessing board state.
 * 
 * Supports:
 * - Fetching and setting user boards
 * - Managing individual boards by ID
 * - Loading public boards for other users
 */
export const useBoard = (initialBoardId?: string) => {
  const context = useContext(BoardContext);

  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }

  const {
    boards,
    setSelectedBoard,
    appendToBoard,
    updateBoardItem,
    removeFromBoard,
    refreshBoards,
  } = context;

  const [board, setBoard] = useState<BoardData | undefined>(
    initialBoardId ? boards[initialBoardId] : undefined
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Fetch all boards for the authenticated user
   */
  const fetchBoards = useCallback(async (userId: string) => {
    try {
      const boardList = await apiFetchBoards(userId);
      await refreshBoards(); // Update context
      return boardList;
    } catch (err) {
      console.error('[useBoard] Failed to fetch user boards:', err);
      return [];
    }
  }, [refreshBoards]);

  /**
   * Loads a board by ID and updates local state.
   */
  const loadBoard = useCallback(async (boardId: string) => {
    setIsLoading(true);
    try {
      const result = await fetchBoardById(boardId);
      setBoard(result);
      return result;
    } catch (err) {
      console.error(`[useBoard] Failed to load board: ${boardId}`, err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Loads a user's public profile boards (quests and posts).
   */
  const loadPublicBoards = useCallback(async (userId: string) => {
    try {
      const result = await fetchPublicBoards(userId);
      return result;
    } catch (err) {
      console.error('[useBoard] Failed to load public boards:', err);
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!board?.id) return;
    const refreshed = await loadBoard(board.id);
    return refreshed;
  }, [board?.id, loadBoard]);

  return {
    board,
    setBoard,
    isLoading,
    fetchBoards,
    loadBoard,
    refresh,
    setSelectedBoard,
    appendToBoard,
    updateBoardItem,
    removeFromBoard,
    loadPublicBoards,
  };
};