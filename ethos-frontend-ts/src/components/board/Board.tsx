import React, { useEffect, useMemo, useState } from 'react';
import { fetchBoardById, fetchBoardItems } from '../../api/board';
import { usePermissions } from '../../hooks/usePermissions'; //TODO: complte usePermissions file
import { useSocket } from '../../hooks/useSocket'; //TODO: complte socket file
import { useAuth } from '../../contexts/AuthContext';
import { getDisplayTitle } from '../../utils/displayUtils';

import EditBoard from './EditBoard';
import CreateContribution from '../contribution/CreateContribution';

import ListLayout from '../layout/ListLayout';
import GridLayout from '../layout/GridLayout';
import GraphLayout from '../layout/GraphLayout';
import ThreadLayout from '../layout/ThreadLayout';

import { Button, Input, Select } from '../ui';

import type { BoardData, BoardProps, BoardStructure } from '../../types/boardTypes';
import type { Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';

/**
 * Board component displays a collection of posts or quests according to a layout.
 * It supports filtering, sorting, editing, and real-time updates.
 */
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
  const { user: currentUser } = useAuth();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Post[]>([]); // Can support Post[] or (Post | Quest)[]

  const { canEditBoard } = usePermissions(currentUser, board);

  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<'createdAt' | 'displayTitle'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  /**
   * Loads the board metadata and its associated items.
   */
  useEffect(() => {
    const loadBoard = async () => {
        if (!boardId) {
            console.warn('No boardId provided. Skipping board load.');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const boardData = await fetchBoardById(boardId);
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

  /**
   * Subscribes to real-time board updates via socket.
   */
  useSocket('board:update', (payload: { boardId: string }) => {
    if (payload.boardId === board?.id) {
      fetchBoardById(board.id).then(setBoard);
      fetchBoardItems(board.id).then((items) => setItems(items as Post[]));
    }
  });

  /**
   * Filter and sort items based on user input and selected criteria.
   */
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

  /**
   * Handle creation of a new contribution (post or quest).
   */
  const handleAdd = async (item: Post | Quest) => {
    setItems((prev) => [item as Post, ...prev]);
    setShowCreateForm(false);
  };

  // Resolve layout and permissions
  const structure: BoardStructure = forcedStructure || board?.structure || 'list';
  const editable = !readOnly && (typeof forcedEditable === 'boolean' ? forcedEditable : canEditBoard);
  const Layout = {
    list: ListLayout,
    grid: GridLayout,
    graph: GraphLayout,
    thread: ThreadLayout,
  }[structure] ?? ListLayout;

  // Handle loading and missing board cases
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
                fetchBoardById(board.id).then((updatedBoard) => {
                  setBoard(updatedBoard);
                  setEditMode(false);
              
                  if (!board?.id) return;
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