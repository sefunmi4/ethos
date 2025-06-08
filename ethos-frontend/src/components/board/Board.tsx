import React, { useEffect, useMemo, useState } from 'react';
import { fetchBoard, fetchBoardItems } from '../../api/board';
import { usePermissions } from '../../hooks/usePermissions';
import { useSocketListener } from '../../hooks/useSocket';
import { getDisplayTitle } from '../../utils/displayUtils';
import { getRenderableBoardItems } from '../../utils/boardUtils';
import { useBoardContext } from '../../contexts/BoardContext';

import EditBoard from './EditBoard';
import CreatePost from '../post/CreatePost';

import GridLayout from '../layout/GridLayout';
import GraphLayout from '../layout/GraphLayout';
import ThreadLayout from '../layout/ThreadLayout';

import { Button, Input, Select } from '../ui';

import type { BoardData, BoardProps, BoardLayout } from '../../types/boardTypes';
import type { Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';

const Board: React.FC<BoardProps> = ({
  boardId,
  title: forcedTitle,
  layout: forcedStructure,
  user,
  editable: forcedEditable,
  readOnly = false,
  compact = false,
  showCreate = true,
  filter = {},
  onScrollEnd,
  loading: loadingMore = false,
  quest,
}) => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<BoardLayout | null>(null);

  const { canEditBoard } = usePermissions();
  const { setSelectedBoard, appendToBoard } = useBoardContext();
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
        const boardData = await fetchBoard(boardId, { enrich: true });
        const boardItems = await fetchBoardItems(boardId, { enrich: true });

        setSelectedBoard(boardId);

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

    fetchBoard(board.id, { enrich: true }).then(setBoard);
    fetchBoardItems(board.id, { enrich: true }).then((items) => setItems(items as Post[]));
  });

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filter?.itemType) {
      result = result.filter((item) =>
        filter.itemType === 'quest'
          ? 'headPostId' in item
          : 'content' in item
      );
    }

    if (filter?.postType) {
      result = result.filter((item) =>
        'type' in item && (item as Post).type === filter.postType
      );
    }

    if (filter?.linkType) {
      result = result.filter(
        (item) =>
          'linkedItems' in item &&
          (item as Post).linkedItems?.some((l) => l.linkType === filter.linkType)
      );
    }

    return result
      .filter((item: Post) => {
        const title = getDisplayTitle(item as Post) ?? '';
        return title.toLowerCase().includes(filterText.toLowerCase());
      })
      .sort((a, b) => {
        const aVal =
          sortKey === 'createdAt' ? a.createdAt ?? '' : getDisplayTitle(a as Post) ?? '';
        const bVal =
          sortKey === 'createdAt' ? b.createdAt ?? '' : getDisplayTitle(b as Post) ?? '';
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [items, filter, filterText, sortKey, sortOrder]);

  const renderableItems = useMemo(
    () => getRenderableBoardItems(filteredItems),
    [filteredItems]
  );

  const questItems = useMemo(
    () => renderableItems.filter((it) => 'headPostId' in it),
    [renderableItems]
  );
  const singleQuest = questItems.length === 1 ? (questItems[0] as Quest) : null;
  const graphEligible = singleQuest !== null;

  const graphItems = useMemo(() => {
    if (!graphEligible) return renderableItems;
    const qid = singleQuest!.id;
    return renderableItems.filter(
      (item) =>
        'headPostId' in item ||
        (item as Post).questId === qid ||
        (item as Post).linkedItems?.some(
          (l) => l.itemType === 'quest' && l.itemId === qid
        )
    );
  }, [renderableItems, graphEligible, singleQuest]);

  const handleAdd = async (item: Post | Quest) => {
    setItems((prev) => [item as Post, ...prev]);
    setShowCreateForm(false);
    if (board) {
      appendToBoard(board.id, item as any);
    }
  };

  const resolvedStructure: BoardLayout =
    viewMode || forcedStructure || board?.layout || 'grid';

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
            onChange={(e) => setViewMode(e.target.value as BoardLayout)}
            options={[
              { value: 'grid', label: 'Grid' },
              ...(graphEligible ? [{ value: 'graph', label: 'Graph' }] : []),
              { value: 'thread', label: 'Timeline' },
            ]}
          />
          {editable && viewMode && (
            <Button variant="ghost" size="sm" onClick={() => setViewMode(null)}>
              Reset View
            </Button>
          )}
          {showCreate && user && (
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

      {/* Create Post Form */}
      {showCreate && showCreateForm && (
        <div className="border rounded-lg p-4 bg-white shadow">
          <CreatePost
            onSave={handleAdd}
            onCancel={() => setShowCreateForm(false)}
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
              fetchBoard(board.id, { enrich: true }).then((updatedBoard) => {
                setBoard(updatedBoard);
                setEditMode(false);
                fetchBoardItems(board.id, { enrich: true }).then((items) =>
                  setItems(items as Post[])
                );
              });
            }}
          />
        </div>
      ) : (
        <Layout
          items={resolvedStructure === 'graph' ? graphItems : renderableItems}
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