import React, { useEffect, useMemo, useState } from 'react';
import { fetchBoard, fetchBoardItems } from '../../api/board';
import { usePermissions } from '../../hooks/usePermissions'; 
import { useSocketListener } from '../../hooks/useSocket'; 
import { getDisplayTitle } from '../../utils/displayUtils';

import EditBoard from './EditBoard';
import CreateContribution from '../contribution/CreateContribution';

import GridLayout from '../layout/GridLayout';
import GraphLayout from '../layout/GraphLayout';
import ThreadLayout from '../layout/ThreadLayout';

import { Button, Input, Select } from '../ui';

import type { BoardData, BoardProps, BoardStructure } from '../../types/boardTypes';
import type { Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';

const Board: React.FC<BoardProps> = ({
  boardId,
  title: forcedTitle,
  structure: forcedStructure,
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
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<BoardStructure | null>(null);

  const { canEditBoard } = usePermissions();
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<'createdAt' | 'displayTitle'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const loadBoard = async () => {
      if (!boardId) {
        console.warn('No boardId provided. Skipping board load.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const boardData = await fetchBoard(boardId);
        const boardItems = await fetchBoardItems(boardId);

        setBoard(boardData);
        setItems(boardItems as Post[]);
      } catch (error) {
        console.error('Error loading board:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBoard();
  }, [boardId]);

  useSocketListener('board:update', (payload: { boardId: string }) => {
    if (!board?.id || payload.boardId !== board.id) return;

    fetchBoard(board.id).then(setBoard);
    fetchBoardItems(board.id).then((items) => setItems(items as Post[]));
  });

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (filter?.type) {
      result = result.filter((item) => item.type === filter.type);
    }

    return result
      .filter((item: Post) => {
        const title = getDisplayTitle(item) ?? '';
        return title.toLowerCase().includes(filterText.toLowerCase());
      })
      .sort((a, b) => {
        const aVal = sortKey === 'createdAt' ? a.createdAt ?? '' : getDisplayTitle(a) ?? '';
        const bVal = sortKey === 'createdAt' ? b.createdAt ?? '' : getDisplayTitle(b) ?? '';
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [items, filter, filterText, sortKey, sortOrder]);

  const handleAdd = async (item: Post | Quest) => {
    setItems((prev) => [item as Post, ...prev]);
    setShowCreateForm(false);
  };

  const resolvedStructure: BoardStructure =
    viewMode || forcedStructure || board?.structure || 'grid';

  const editable = useMemo(() => {
    if (readOnly) return false;
    if (typeof forcedEditable === 'boolean') return forcedEditable;
    return board?.id ? canEditBoard(board.id) : false;
  }, [readOnly, forcedEditable, board?.id, canEditBoard]);

  const Layout = {
    grid: GridLayout,
    graph: GraphLayout,
    thread: ThreadLayout,
  }[resolvedStructure] ?? GridLayout;

  if (loading) {
    return <div className="text-gray-500 p-4">Loading board...</div>;
  }

  if (!board) {
    return <div className="text-red-500 p-4">Board not found.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Board Header */}
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
          <Select
            value={resolvedStructure}
            onChange={(e) => setViewMode(e.target.value as BoardStructure)}
            options={[
              { value: 'grid', label: 'Grid' },
              { value: 'graph', label: 'Graph' },
              { value: 'thread', label: 'Timeline' },
            ]}
          />
          {editable && viewMode && (
            <Button variant="ghost" size="sm" onClick={() => setViewMode(null)}>
              Reset View
            </Button>
          )}
          {editable && showCreate && (
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              + Add Item
            </Button>
          )}
          {editable && (
            <Button variant="secondary" onClick={() => setEditMode(true)}>
              ✏️ Edit Board
            </Button>
          )}
        </div>
      </div>

      {/* Create Contribution Form */}
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

      {/* Edit Board Form */}
      {editMode ? (
        <div className="border rounded-lg p-4 bg-white shadow">
          <EditBoard
            board={board}
            onCancel={() => setEditMode(false)}
            onSave={() => {
              if (!board?.id) return;
              fetchBoard(board.id).then((updatedBoard) => {
                setBoard(updatedBoard);
                setEditMode(false);
                fetchBoardItems(board.id).then((items) => setItems(items as Post[]));
              });
            }}
          />
        </div>
      ) : (
        <Layout
          items={filteredItems}
          compact={compact}
          user={user}
          onScrollEnd={onScrollEnd}
          loadingMore={loadingMore}
          contributions={items}
          questId={quest?.id || ''}
        />
      )}
    </div>
  );
};

export default Board;