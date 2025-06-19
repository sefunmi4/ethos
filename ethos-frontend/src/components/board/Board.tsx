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

import { Button, Input, Select, Spinner } from '../ui';

import type { BoardData, BoardProps, BoardLayout } from '../../types/boardTypes';
import type { Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';

const Board: React.FC<BoardProps> = ({
  boardId,
  board: boardProp,
  title: forcedTitle,
  layout: forcedStructure,
  user,
  editable: forcedEditable,
  readOnly = false,
  compact = false,
  showCreate = true,
  hideControls = false,
  filter = {},
  onScrollEnd,
  loading: loadingMore = false,
  quest,
  gridLayout,
  initialExpanded = false,
}) => {
  const [board, setBoard] = useState<BoardData | null>(boardProp ?? null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<BoardLayout | null>(null);

  const { canEditBoard } = usePermissions();
  const { setSelectedBoard, appendToBoard, updateBoardItem, boards } = useBoardContext();
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<'createdAt' | 'displayTitle'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Keep items state in sync with BoardContext updates
  useEffect(() => {
    if (!board?.id) return;
    const enriched = boards[board.id]?.enrichedItems || [];
    setItems(enriched as Post[]);
  }, [board?.id, boards[board?.id]?.enrichedItems]);

  useEffect(() => {
    const loadBoard = async () => {
      if (!boardId) {
        console.warn('No boardId provided. Skipping board load.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const boardData = await fetchBoard(boardId, {
          enrich: true,
          userId: user?.id,
        });
        const boardItems = await fetchBoardItems(boardId, {
          enrich: true,
          userId: user?.id,
        });

        setSelectedBoard(boardId);

        setBoard(boardData);
        setItems(boardItems as Post[]);
      } catch (error) {
        console.error('Error loading board:', error);
      } finally {
        setLoading(false);
      }
    };

    if (boardProp) {
      setSelectedBoard(boardProp.id);
      setBoard(boardProp);
      setItems((boardProp.enrichedItems || []) as Post[]);
      setLoading(false);
    } else {
      loadBoard();
    }
  }, [boardId, boardProp]);

  useSocketListener('board:update', (payload: { boardId: string }) => {
    if (!board?.id || payload.boardId !== board.id) return;

    fetchBoard(board.id, { enrich: true, userId: user?.id }).then(setBoard);
    fetchBoardItems(board.id, { enrich: true, userId: user?.id }).then((items) =>
      setItems(items as Post[])
    );
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

  const isItemRelatedToQuest = (item: Post | Quest, qid: string) =>
    'headPostId' in item ||
    (item as Post).questId === qid ||
    (item as Post).linkedItems?.some(
      (l) => l.itemType === 'quest' && l.itemId === qid
    );

  const graphEligible = useMemo(() => {
    if (!singleQuest) return false;
    const qid = singleQuest.id;
    return renderableItems.every((item) => isItemRelatedToQuest(item, qid));
  }, [singleQuest, renderableItems]);

  const graphItems = useMemo(() => {
    if (!singleQuest) return renderableItems;
    const qid = singleQuest.id;
    return renderableItems.filter((item) => isItemRelatedToQuest(item, qid));
  }, [renderableItems, singleQuest]);

  const handleAdd = async (item: Post | Quest) => {
    setItems((prev) => [item as Post, ...prev]);
    setShowCreateForm(false);
    if (board) {
      appendToBoard(board.id, item as any);
    }
  };

  const baseStructure: BoardLayout =
    (viewMode || forcedStructure || board?.layout || 'grid') as BoardLayout;
  const resolvedStructure: BoardLayout =
    baseStructure === 'graph' && !graphEligible ? 'grid' : baseStructure;

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
    return <Spinner />;
  }

  if (!board) {
    return <div className="text-red-500 p-4">Board not found.</div>;
  }

  return (
    <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg max-w-5xl mx-auto">
      {/* Board Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {forcedTitle || board.title || 'Board'}
        </h2>

        <div className="flex gap-2 flex-wrap items-center">
          {!hideControls && (
            <>
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
            </>
          )}
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
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow">
          <CreatePost
            onSave={handleAdd}
            onCancel={() => setShowCreateForm(false)}
            boardId={board.id}
          />
        </div>
      )}

      {/* Edit Board Form */}
      {editMode ? (
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow">
          <EditBoard
            board={board}
            onCancel={() => setEditMode(false)}
            onSave={() => {
              if (!board?.id) return;
                fetchBoard(board.id, { enrich: true, userId: user?.id }).then((updatedBoard) => {
                  setBoard(updatedBoard);
                  setEditMode(false);
                  fetchBoardItems(board.id, { enrich: true, userId: user?.id }).then((items) =>
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
          initialExpanded={initialExpanded}
          {...(resolvedStructure === 'graph'
            ? { edges: quest?.taskGraph }
            : {})}
          {...(resolvedStructure === 'grid' ? { layout: gridLayout } : {})}
        />
      )}
    </div>
  );
};

export default Board;