import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBoard, fetchBoardItems } from '../../api/board';
import { usePermissions } from '../../hooks/usePermissions';
import { useSocketListener } from '../../hooks/useSocket';
import { getDisplayTitle, toTitleCase } from '../../utils/displayUtils';
import { getRenderableBoardItems } from '../../utils/boardUtils';
import { useBoardContext } from '../../contexts/BoardContext';
import type { BoardItem } from '../../contexts/BoardContextTypes';

import EditBoard from './EditBoard';
import CreatePost from '../post/CreatePost';
import CreateQuest from '../quest/CreateQuest';

import GridLayout from '../layout/GridLayout';
import ListLayout from '../layout/ListLayout';
import GraphLayout from '../layout/GraphLayout';
import MapGraphLayout from '../layout/MapGraphLayout';

import { Button, Input, Select, Spinner } from '../ui';
import { POST_TYPES } from '../../constants/options';

import type {
  BoardData,
  BoardProps,
  BoardLayout,
  BoardFilters,
} from '../../types/boardTypes';
import type { Post, PostType } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';

const EMPTY_FILTER: BoardFilters = {};

interface LocalFilter {
  itemType: string;
  postType: PostType | 'request' | 'review' | '';
  linkType: string;
}

const resolveTitle = (item: BoardItem): string =>
  'headPostId' in item || 'content' in item
    ? getDisplayTitle(item as Quest | Post) ?? ''
    : item.title ?? '';

const isItemRelatedToQuest = (item: BoardItem, qid: string) =>
  'headPostId' in item ||
  (item as Post).questId === qid ||
  (item as Post).linkedItems?.some(
    (l) => l.itemType === 'quest' && l.itemId === qid
  );

const LAYOUT_COMPONENTS: Partial<
  Record<BoardLayout, React.ComponentType<Record<string, unknown>>>
> = {
  grid: GridLayout as unknown as React.ComponentType<Record<string, unknown>>,
  list: ListLayout as unknown as React.ComponentType<Record<string, unknown>>,
  horizontal:
    GridLayout as unknown as React.ComponentType<Record<string, unknown>>,
  kanban: GridLayout as unknown as React.ComponentType<Record<string, unknown>>,
  graph: GraphLayout as unknown as React.ComponentType<Record<string, unknown>>,
  'graph-condensed':
    GraphLayout as unknown as React.ComponentType<Record<string, unknown>>,
  'map-graph':
    MapGraphLayout as unknown as React.ComponentType<Record<string, unknown>>,
};

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
  createLabel,
  hideControls = true,
  filter = EMPTY_FILTER,
  onScrollEnd,
  loading: loadingMore = false,
  quest,
  gridLayout,
  initialExpanded = false,
  headerOnly = false,
}) => {
  const [board, setBoard] = useState<BoardData | null>(boardProp ?? null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [viewMode, setViewMode] = useState<BoardLayout | null>(null);

  const isQuestBoard = (boardId || boardProp?.id || board?.id) === 'quest-board';

  const { canEditBoard } = usePermissions();
  const {
    setSelectedBoard,
    appendToBoard,
    boards,
    expandedItemId,
    setExpandedItemId,
  } = useBoardContext();
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<'createdAt' | 'displayTitle'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const createBtnLabel = createLabel ||
    (board?.boardType === 'quest'
      ? 'Quest'
      : board?.id === 'quest-board'
      ? 'Request'
      : ['timeline-board', 'my-posts'].includes(board?.id || '')
      ? 'Post'
      : 'Item');

  const {
    itemType = '',
    postType = '',
    linkType = '',
  } = filter as Record<string, string>;

  const [localFilter, setLocalFilter] = useState<LocalFilter>({
    itemType,
    postType: postType as PostType | 'request' | 'review' | '',
    linkType,
  });

  useEffect(() => {
    setLocalFilter({
      itemType,
      postType: postType as PostType | 'request' | 'review' | '',
      linkType,
    });
  }, [itemType, postType, linkType]);

  // Keep items state in sync with BoardContext updates
  useEffect(() => {
    if (!board?.id) return;
    setItems((boards[board.id]?.enrichedItems as BoardItem[]) || []);
  }, [board?.id, boards]);

  const userId = user?.id;

  const refreshBoard = useCallback(
    async (id: string) => {
      const [boardData, boardItems] = await Promise.all([
        fetchBoard(id, { enrich: true, userId }),
        fetchBoardItems(id, { enrich: true, userId }),
      ]);
      setBoard(boardData);
      setItems(boardItems as BoardItem[]);
    },
    [userId]
  );

  useEffect(() => {
    if (boardProp) {
      setSelectedBoard(boardProp.id);
      setBoard(boardProp);
      setItems((boardProp.enrichedItems || []) as BoardItem[]);
      setLoading(false);
      return;
    }

    if (!boardId) {
      console.warn('No boardId provided. Skipping board load.');
      setLoading(false);
      return;
    }

    setSelectedBoard(boardId); // set early to avoid flicker
    setLoading(true);
    refreshBoard(boardId)
      .catch((error) => {
        console.error('Error loading board:', error);
      })
      .finally(() => setLoading(false));
  }, [boardId, boardProp, refreshBoard, setSelectedBoard]);

  useSocketListener('board:update', (data) => {
    const payload = data as BoardData;
    if (board?.id && payload.id === board.id) {
      refreshBoard(board.id);
    }
  });

  const effectiveFilter = useMemo(
    () => ({ ...filter, ...localFilter }),
    [filter, localFilter]
  );

  const filteredItems = useMemo(() => {
    let result = [...items];
    const currentBoardId = board?.id || boardId || '';
    if (['timeline-board', 'my-posts'].includes(currentBoardId)) {
      result = result.filter(
        (item) => !('tags' in item && (item as Post).tags?.includes('request'))
      );
    }

    const { itemType: iType, postType: pType, linkType: lType } = effectiveFilter;

    if (iType) {
      result = result.filter((item) =>
        iType === 'quest' ? 'headPostId' in item : 'content' in item
      );
    }

    if (pType) {
      result = result.filter(
        (item) => 'type' in item && (item as Post).type === pType
      );
    }

    if (lType) {
      result = result.filter(
        (item) =>
          'linkedItems' in item &&
          (item as Post).linkedItems?.some((l) => l.linkType === lType)
      );
    }

    return result
      .filter((item: BoardItem) =>
        resolveTitle(item).toLowerCase().includes(filterText.toLowerCase())
      )
      .sort((a, b) => {
        const aVal = sortKey === 'createdAt' ? a.createdAt ?? '' : resolveTitle(a);
        const bVal = sortKey === 'createdAt' ? b.createdAt ?? '' : resolveTitle(b);
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [items, effectiveFilter, filterText, sortKey, sortOrder, board?.id, boardId]);

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
    if (board?.id === 'quest-board') {
      return ['request', 'review'];
    }
    const types = new Set<string>();
    renderableItems.forEach((it) => {
      if ('type' in it) types.add((it as Post).type);
    });
    return Array.from(types);
  }, [renderableItems, board?.id]);

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

  const graphEligible = useMemo(() => {
    if (!singleQuest) return false;
    const qid = singleQuest.id;
    return renderableItems.every((item) => isItemRelatedToQuest(item, qid));
  }, [singleQuest, renderableItems]);

  const graphItems = useMemo<Post[]>(() => {
    const base = singleQuest
      ? renderableItems.filter((item) =>
          isItemRelatedToQuest(item, singleQuest.id)
        )
      : renderableItems;
    return base.filter((item): item is Post => 'type' in item);
  }, [singleQuest, renderableItems]);

  const mapGraphItems = useMemo(
    () =>
      graphItems.filter((item) => (item as Post).type === 'task'),
    [graphItems]
  );

  const mapGraphEdges = useMemo(() => {
    const allowed = new Set(mapGraphItems.map((it) => it.id));
    return (quest?.taskGraph || []).filter(
      (e) => allowed.has(e.from) && allowed.has(e.to)
    );
  }, [mapGraphItems, quest?.taskGraph]);

  const handleAdd = async (item: Post | Quest) => {
    setItems((prev) => [item as BoardItem, ...prev]);
    setShowCreateForm(false);
    if (board) {
      appendToBoard(board.id, item as unknown as BoardItem);
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
  const layoutItems = useMemo<Post[]>(() => {
    if (resolvedStructure === 'map-graph') return mapGraphItems;
    if (resolvedStructure === 'graph' || resolvedStructure === 'graph-condensed')
      return graphItems;
    return renderableItems.filter((it): it is Post => 'type' in it);
  }, [resolvedStructure, mapGraphItems, graphItems, renderableItems]);

  const LayoutComponent = (
    LAYOUT_COMPONENTS[resolvedStructure] ?? GridLayout
  ) as React.ComponentType<Record<string, unknown>>;

  if (loading) {
    return <Spinner />;
  }

  if (!board) {
    return <div className="text-error p-4">Board not found.</div>;
  }

  const containerBg = 'bg-board-bg';
  const panelBg = 'bg-board-bg';

  return (
    <div className={`space-y-4 p-6 rounded-xl shadow-lg max-w-5xl mx-auto ${containerBg}`}>
      {/* Board Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold text-primary dark:text-primary">
          {toTitleCase(forcedTitle || board.title || 'Board')}
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
                  setLocalFilter((p) => ({
                    ...p,
                    postType: e.target.value as PostType | 'request' | 'review' | '',
                  }))
                }
                options={[
                  { value: '', label: 'All Posts' },
                  ...postTypes.map((t) => {
                    const opt = POST_TYPES.find((o) => o.value === t);
                    return { value: t, label: opt?.label || t };
                  })
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
                  { value: 'list', label: 'List' },
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
            <Button
              variant="contrast"
              onClick={() => setShowCreateForm((p) => !p)}
            >
              {showCreateForm
                ? `- Cancel ${createBtnLabel}`
                : `+ Add ${createBtnLabel}`}
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
              initialType={
                localFilter.postType ||
                (board.id === 'quest-board' ? 'request' : 'free_speech')
              }
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
              refreshBoard(board.id).then(() => setEditMode(false));
            }}
          />
        </div>
      ) : hasItems ? (
        <LayoutComponent
          items={layoutItems}
          compact={compact}
          user={user}
          onScrollEnd={onScrollEnd}
          loadingMore={loadingMore}
          questId={quest?.id || ''}
          boardId={board?.id}
          initialExpanded={initialExpanded}
          expandedId={expandedItemId}
          onExpand={setExpandedItemId}
          headerOnly={isQuestBoard || headerOnly}
          editable={editable}
          {...(resolvedStructure === 'map-graph'
            ? { edges: mapGraphEdges }
            : resolvedStructure === 'graph' ||
              resolvedStructure === 'graph-condensed'
            ? { edges: quest?.taskGraph }
            : {})}
          {...(resolvedStructure === 'graph-condensed' ? { condensed: true } : {})}
          {...(['grid', 'list', 'horizontal', 'kanban'].includes(resolvedStructure)
            ? { layout: resolvedStructure === 'grid' ? gridLayout : resolvedStructure }
            : {})}
        />
      ) : (
        <div className="text-center text-secondary py-8">No posts available to view.</div>
      )}
    </div>
  );
};

export default Board;
