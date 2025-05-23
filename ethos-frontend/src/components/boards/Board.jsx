import React, { useContext, useState } from 'react';
import { BoardContext } from '../../contexts/BoardContext';
import structureComponents from './structures';
import { sortByPriority, filterBySearch } from './utils';
import BoardAddItem from './BoardAddItem';

/**
 * Board.jsx
 *
 * Dynamic board renderer supporting:
 * - Structure override via prop/context
 * - Sorting, filtering, searching
 * - Adding new posts to the board contextually
 */
const Board = ({
  board = {},
  structure,               // Optional override
  renderItem,              // Optional custom item renderer
  allowSorting = true,
  allowFiltering = true,
  filters: externalFilters = {},
  search = ''
}) => {
  const context = useContext(BoardContext);
  const boardId = board.id || context?.board?.id || null;
  const boardStructure = board.structure || context?.structure || 'list';
  const StructureComponent = structureComponents[structure || boardStructure] || structureComponents.list;

  const [items, setItems] = useState(board.items || context.items || []);

  const filters = {
    ...(context.filters || {}),
    ...externalFilters,
  };

  // Apply search + type filtering
  let filteredItems = filterBySearch(items, search);
  if (filters.type) {
    filteredItems = filteredItems.filter(item => item.type === filters.type);
  }

  // Sort if enabled
  const sortedItems = allowSorting ? sortByPriority(filteredItems) : filteredItems;

  // Handle adding new items
  const handleCreate = (newItem) => {
    setItems(prev => [...prev, newItem]);
  };

  // Handle nested structure (e.g., thread inside thread)
  const isNested = sortedItems.length === 1 && sortedItems[0]?.structure;
  if (isNested) {
    const Nested = structureComponents[sortedItems[0].structure] || StructureComponent;
    return (
      <div className="relative">
        <Nested
          items={sortedItems[0].items || []}
          renderItem={renderItem}
        />
        <BoardAddItem boardId={boardId} onCreate={handleCreate} />
      </div>
    );
  }

  return (
    <div className="relative">
      <StructureComponent
        items={sortedItems}
        renderItem={renderItem}
      />
      <BoardAddItem boardId={boardId} onCreate={handleCreate} />
    </div>
  );
};

export default Board;