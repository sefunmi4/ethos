import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosWithAuth } from '../utils/authUtils';
import { useAuth } from './AuthContext';

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBoards = async () => {
      setLoading(true);
      try {
        const res = user
          ? await axiosWithAuth.get('/boards?userBoards=true')
          : await axiosWithAuth.get('/boards?guestBoards=true');
        setBoards(res.data);
        setSelectedBoard(res.data[0] || null);
      } catch (err) {
        console.error('[BoardContext] Failed to load boards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBoards();
  }, [user]);

  const value = {
    boards,
    selectedBoard,
    setSelectedBoard,
    loading,
    refreshBoards: () => {
      if (user) {
        axiosWithAuth.get('/boards?userBoards=true').then((res) => {
          setBoards(res.data);
        });
      }
    },
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export const useBoardContext = () => {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoardContext must be used within a BoardProvider');
  return ctx;
};