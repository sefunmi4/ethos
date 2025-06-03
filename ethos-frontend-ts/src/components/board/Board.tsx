import React, { useMemo, useState } from 'react';
import { useBoard } from '../../hooks/useBoard';
import { usePermissions } from '../../hooks/usePermissions';
import { useSocket } from '../../hooks/useSocket';

import { getDisplayTitle } from '../../utils/postUtils';

import { useAuth } from '../../contexts/AuthContext';

import CreateContribution from '../contribution/CreateContribution';

import ListLayout from '../layout/ListLayout';
import GridLayout from '../layout/GridLayout';
import GraphLayout from '../layout/GraphLayout';
import ThreadLayout from '../layout/ThreadLayout';

import { Button, Input, Select } from '../ui';

import type { BoardData } from '../../types/boardTypes';
import type { Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';
import type { User } from '../../types/userTypes';

type BoardStructure = 'list' | 'grid' | 'graph' | 'thread';

interface BoardProps {
  boardId?: string;
  board?: BoardData;
  structure?: BoardStructure;
  title?: string;
  user?: User;
  editable?: boolean;
  readOnly?: boolean;
  compact?: boolean;
  showCreate?: boolean;
  filter?: Record<string, any>;
  onScrollEnd?: () => void;
  loading?: boolean;
  quest?: Quest;
}

/**
 * 🎯 Renders a board of contributions using customizable layout.
 * Supports live updates, filtering, sorting, and conditional editing.
 */
const Board: React.FC<BoardProps> = ({
  boardId,
  board: initialBoard,
  structure: forcedStructure,
  title: forcedTitle,
  user,
  editable: forcedEditable,
  readOnly = false,
  compact = false,
  showCreate = false,
  filter = {},
  onScrollEnd,
  loading: loadingMore = false,
  quest,
}) => {
  const { user: currentUser } = useAuth();

  // 📥 Load board and items
  const {
    board,
    items,
    loading,
    addItem,
    refreshBoard,
  } = useBoard({ boardId, initialBoard, filter });

  const { canEditBoard } = usePermissions(currentUser, board);

  // 🔄 Sync on external updates
  useSocket('board:update', (payload: { boardId: string }) => {
    if (payload.boardId === board?.id) {
      refreshBoard();
    }
  });

  // 📊 State for UI filters and sorting
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<'createdAt' | 'displayTitle'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 🧹 Apply filter & sorting logic
  const filteredItems = useMemo((): Post[] => {
    return items
      .filter((item: Post) => {
        const displayTitle = getDisplayTitle(item);
        return displayTitle.toLowerCase().includes(filterText.toLowerCase());
      })
      .sort((a: Post, b: Post) => {
        const aVal = sortKey === 'createdAt'
          ? a.createdAt ?? ''
          : getDisplayTitle(a) ?? '';
        const bVal = sortKey === 'createdAt'
          ? b.createdAt ?? ''
          : getDisplayTitle(b) ?? '';
      
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
  }, [items, filterText, sortKey, sortOrder]);

  // ➕ Handle contribution creation
  const handleAdd = async (item: Post | Quest) => {
    await addItem(item);
    setShowCreateForm(false);
  };

  // 📐 Select layout based on props or board default
  const structure: BoardStructure = forcedStructure || board?.structure || 'list';
  const editable = !readOnly && (typeof forcedEditable === 'boolean' ? forcedEditable : canEditBoard);

  const layoutMap: Record<BoardStructure, React.ComponentType<any>> = {
    list: ListLayout,
    grid: GridLayout,
    graph: GraphLayout,
    thread: ThreadLayout,
  };

  const Layout = layoutMap[structure] || ListLayout;

  // 🚦 Handle loading & missing board state
  if (loading) return <div className="text-gray-500 p-4">Loading board...</div>;
  if (!board) return <div className="text-red-500 p-4">Board not found.</div>;

  return (
    <div className="space-y-4">
      {/* 🏷️ Board Title + Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold text-gray-800">
          {forcedTitle || board.title || 'Board'}
        </h2>

        <div className="flex gap-2 flex-wrap items-center">
          <Input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter..."
            className="w-40 text-sm"
          />
          <Select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as 'createdAt' | 'displayTitle')}
            options={[
              { value: 'createdAt', label: 'Date' },
              { value: 'displayTitle', label: 'Node Label' },
            ]}
          />
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            options={[
              { value: 'asc', label: 'Asc' },
              { value: 'desc', label: 'Desc' },
            ]}
          />
          {editable && showCreate && (
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              + Add Item
            </Button>
          )}
        </div>
      </div>

      {/* 🆕 Create Contribution Form */}
      {showCreate && showCreateForm && (
        <div className="border rounded-lg p-4 bg-white shadow">
          <CreateContribution
            onSave={handleAdd}
            onCancel={() => setShowCreateForm(false)}
            boards={[board]}
            quests={quest ? [quest] : []}
          />
        </div>
      )}

      {/* 📋 Render Posts using Layout */}
      <Layout
        items={filteredItems}
        compact={compact}
        user={user}
        onScrollEnd={onScrollEnd}
        loadingMore={loadingMore}
      />
    </div>
  );
};

export default Board;