import React, { createContext, useContext, useState, useEffect } from 'react';

export const BoardContext = createContext();

export const BoardProvider = ({
  children,
  initialStructure = 'list',
  initialFilters = {},
}) => {
  const [items, setItems] = useState([]); // Can be posts, quests, or threads
  const [structure, setStructure] = useState(initialStructure); // 'list', 'grid', 'tree', 'scroll'
  const [filters, setFilters] = useState(initialFilters);
  const [viewMode, setViewMode] = useState('default'); // 'default', 'compact', 'expanded'

  // Used to preserve item context between board and detail views
  const [activeItemId, setActiveItemId] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);

  useEffect(() => {
    // Optional: fetch board layout config
  }, []);

  return (
    <BoardContext.Provider
      value={{
        items,
        setItems,
        structure,
        setStructure,
        filters,
        setFilters,
        viewMode,
        setViewMode,
        activeItemId,
        setActiveItemId,
        selectedThreadId,
        setSelectedThreadId,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => useContext(BoardContext);
