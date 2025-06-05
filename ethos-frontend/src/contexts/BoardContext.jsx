import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosWithAuth } from '../utils/authUtils';
import { useAuth } from './AuthContext';

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
  const { user } = useAuth();
  const [boards, setBoards] = useState({});
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBoards = async () => {
      setLoading(true);
      try {
        const res = user
          ? await axiosWithAuth.get('/boards?userBoards=true')
          : await axiosWithAuth.get('/boards?guestBoards=true');

        const boardMap = {};
        res.data.forEach((b) => {
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

  // 👉 Additions for real-time-ish board updates
  const appendToBoard = (boardId, newItem) => {
    setBoards((prev) => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        enrichedItems: [newItem, ...(prev[boardId]?.enrichedItems || [])],
      },
    }));
  };

  const updateBoardItem = (boardId, updatedItem) => {
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

  const removeItemFromBoard = (boardId, itemId) => {
    setBoards((prev) => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        enrichedItems: (prev[boardId]?.enrichedItems || []).filter((item) => item.id !== itemId),
      },
    }));
  };

  const refreshBoards = async () => {
    if (!user) return;
    try {
      const res = await axiosWithAuth.get('/boards?userBoards=true');
      const boardMap = {};
      res.data.forEach((b) => {
        boardMap[b.id] = b;
      });
      setBoards(boardMap);
    } catch (err) {
      console.error('[BoardContext] Failed to refresh boards:', err);
    }
  };

  const value = {
    boards,
    selectedBoard,
    setSelectedBoard,
    loading,
    refreshBoards,
    appendToBoard,
    updateBoardItem,
    removeItemFromBoard,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export const useBoardContext = () => {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoardContext must be used within a BoardProvider');
  return ctx;
};