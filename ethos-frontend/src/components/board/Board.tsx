import React, { useEffect, useMemo, useState } from 'react';
import { fetchBoard, fetchBoardItems } from '../../api/board';
import { usePermissions } from '../../hooks/usePermissions';
import { useSocketListener } from '../../hooks/useSocket';
import { getDisplayTitle } from '../../utils/displayUtils';
import { getRenderableBoardItems } from '../../utils/boardUtils';
import { useBoardContext } from '../../contexts/BoardContext';

import EditBoard from './EditBoard';
import CreatePost from '../post/CreatePost';
import CreateQuest from '../quest/CreateQuest';

import GridLayout from '../layout/GridLayout';
import GraphLayout from '../layout/GraphLayout';
import MapGraphLayout from '../layout/MapGraphLayout';

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
  const [localFilter, setLocalFilter] = useState({
    itemType: filter.itemType || '',
    postType: filter.postType || '',
    linkType: filter.linkType || '',
  });

  useEffect(() => {
    setLocalFilter({
      itemType: filter.itemType || '',
      postType: filter.postType || '',
      linkType: filter.linkType || '',
    });
  }, [filter.itemType, filter.postType, filter.linkType]);

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
    const effective = { ...filter, ...localFilter };
    let result = [...items];

    if (effective.itemType) {
      result = result.filter((item) =>
        effective.itemType === 'quest'
          ? 'headPostId' in item
          : 'content' in item
      );
    }

    if (effective.postType) {
      result = result.filter((item) =>
        'type' in item && (item as Post).type === effective.postType
      );
    }

    if (effective.linkType) {
      result = result.filter(
        (item) =>
          'linkedItems' in item &&
          (item as Post).linkedItems?.some((l) => l.linkType === effective.linkType)
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
  }, [items, filter, localFilter, filterText, sortKey, sortOrder]);

  const renderableItems = useMemo(
    () => getRenderableBoardItems(filteredItems),
    [filteredItems]
  );
  const hasItems = renderableItems.length > 0;

  const itemTypes = useMemo(() => {
    const types = new Set<string>();
    renderableItems.forEach((it) => {
      if ('headPostId' in it) types.add('quest');
      else if ('type' in it) types.add('post');
    });
    return Array.from(types);
  }, [renderableItems]);

  const postTypes = useMemo(() => {
    const types = new Set<string>();
    renderableItems.forEach((it) => {
      if ('type' in it) types.add((it as Post).type);
    });
    return Array.from(types);
  }, [renderableItems]);

  const linkTypes = useMemo(() => {
    const types = new Set<string>();
    renderableItems.forEach((it) => {
      if ('linkedItems' in it) {
        (it as Post).linkedItems?.forEach((l) => {
          if (l.linkType) types.add(l.linkType);
        });
      }
    });
    return Array.from(types);
  }, [renderableItems]);

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
    (baseStructure === 'graph' || baseStructure === 'graph-condensed') && !graphEligible
      ? 'grid'
      : baseStructure;

  const editable = useMemo(() => {
    if (readOnly) return false;
    if (typeof forcedEditable === 'boolean') return forcedEditable;
    return board?.id ? canEditBoard(board.id) : false;
  }, [readOnly, forcedEditable, board?.id, canEditBoard]);

  const activeView = useMemo<'map' | 'log' | 'file-change'>(() => {
    if (['map-graph', 'graph', 'graph-condensed'].includes(resolvedStructure)) {
      return 'map';
    }
    const hasCommit = renderableItems.some(
      (it) => 'type' in it && (it as Post).type === 'commit'
    );
    return hasCommit ? 'file-change' : 'log';
  }, [resolvedStructure, renderableItems]);

  const Layout = {
    grid: GridLayout,
    horizontal: GridLayout,
    kanban: GridLayout,
    graph: GraphLayout,
    'graph-condensed': GraphLayout,
    'map-graph': MapGraphLayout,
  }[resolvedStructure] ?? GridLayout;

  if (loading) {
    return <Spinner />;
  }

  if (!board) {
    return <div className="text-error p-4">Board not found.</div>;
  }

  const containerBg = 'bg-surface';
  const panelBg = 'bg-surface';

  return (
    <div className={`space-y-4 p-6 rounded-xl shadow-lg max-w-5xl mx-auto ${containerBg}`}>
      {/* Board Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold text-primary dark:text-primary">
          {forcedTitle || board.title || 'Board'}
        </h2>

        <div className="flex gap-2 flex-wrap items-center">
          {!hideControls && hasItems && (
            <>
              <Input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter..."
                className="w-40 text-sm"
              />
              {itemTypes.length > 1 && (
                <Select
                  value={localFilter.itemType}
                  onChange={(e) =>
                    setLocalFilter((p) => ({ ...p, itemType: e.target.value }))
                  }
                  options={[
                    { value: '', label: 'All Items' },
                    ...itemTypes.map((t) => ({ value: t, label: t }))
                  ]}
                />
              )}
              {postTypes.length > 1 && (
                <Select
                  value={localFilter.postType}
                  onChange={(e) =>
                    setLocalFilter((p) => ({ ...p, postType: e.target.value }))
                  }
                  options={[
                    { value: '', label: 'All Posts' },
                    ...postTypes.map((t) => ({ value: t, label: t }))
                  ]}
                />
              )}
              {linkTypes.length > 1 && (
                <Select
                  value={localFilter.linkType}
                  onChange={(e) =>
                    setLocalFilter((p) => ({ ...p, linkType: e.target.value }))
                  }
                  options={[
                    { value: '', label: 'All Links' },
                    ...linkTypes.map((t) => ({ value: t, label: t }))
                  ]}
                />
              )}
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
                  { value: 'horizontal', label: 'Horizontal' },
                  { value: 'kanban', label: 'Kanban' },
                  ...(graphEligible
                    ? [
                        { value: 'graph', label: 'Graph' },
                        { value: 'graph-condensed', label: 'Graph (Condensed)' },
                        { value: 'map-graph', label: 'Map Graph' },
                      ]
                    : []),
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
            <Button variant="contrast" onClick={() => setShowCreateForm(true)}>
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

      {/* Create Item Form */}
      {showCreate && showCreateForm && (
        <div className={`border rounded-lg p-4 shadow ${panelBg}`}>
          {board.boardType === 'quest' ? (
            <CreateQuest
              onSave={handleAdd}
              onCancel={() => setShowCreateForm(false)}
              boardId={board.id}
            />
          ) : (
            <CreatePost
              onSave={handleAdd}
              onCancel={() => setShowCreateForm(false)}
              boardId={board.id}
              currentView={activeView}
            />
          )}
        </div>
      )}

      {/* Edit Board Form */}
      {editMode ? (
        <div className={`border rounded-lg p-4 shadow ${panelBg}`}> 
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
          items={
            resolvedStructure === 'graph' ||
            resolvedStructure === 'graph-condensed' ||
            resolvedStructure === 'map-graph'
              ? graphItems
              : renderableItems
          }
          compact={compact}
          user={user}
          onScrollEnd={onScrollEnd}
          loadingMore={loadingMore}
          contributions={items}
          questId={quest?.id || ''}
          initialExpanded={initialExpanded}
          editable={editable}
          {...(resolvedStructure === 'graph' ||
            resolvedStructure === 'graph-condensed' ||
            resolvedStructure === 'map-graph'
              ? { edges: quest?.taskGraph }
              : {})}
          {...(resolvedStructure === 'graph-condensed' ? { condensed: true } : {})}
          {...(['grid', 'horizontal', 'kanban'].includes(resolvedStructure)
            ? { layout: resolvedStructure === 'grid' ? gridLayout : resolvedStructure }
            : {})}
        />
      )}
    </div>
  );
};

export default Board;
