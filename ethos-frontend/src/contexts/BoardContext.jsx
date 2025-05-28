import React, { createContext, useContext, useState } from 'react';

// Create the BoardContext
const BoardContext = createContext();

// Default structure settings
const defaultStructure = {
  layout: 'grid', // other options: 'list', 'tree'
  filters: [],
  sortBy: 'updatedAt',
  featured: false
};

export const BoardProvider = ({ children }) => {
  const [selectedBoard, setSelectedBoard] = useState(null);  // active board object
  const [structure, setStructure] = useState(defaultStructure);
  const [meta, setMeta] = useState({ title: '', description: '' });

  const updateBoard = (board) => {
    setSelectedBoard(board);
    setStructure(board.structure || defaultStructure);
    setMeta({ title: board.title, description: board.description || '' });
  };

  const updateStructure = (updates) => {
    setStructure((prev) => ({ ...prev, ...updates }));
  };

  const resetBoard = () => {
    setSelectedBoard(null);
    setStructure(defaultStructure);
    setMeta({ title: '', description: '' });
  };

  return (
    <BoardContext.Provider
      value={{
        selectedBoard,
        structure,
        meta,
        setSelectedBoard: updateBoard,
        updateStructure,
        resetBoard
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

// Custom hook for accessing board context
export const useBoardContext = () => useContext(BoardContext);