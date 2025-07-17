import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import ContributionCard from '../contribution/ContributionCard';
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { updatePost, archivePost } from '../../api/post';
import { useBoardContext } from '../../contexts/BoardContext';
import type { BoardItem } from '../../contexts/BoardContextTypes';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { Spinner } from '../ui';

import { ErrorBoundary } from '../ui';
type GridLayoutProps = {
  items: Post[];
  user?: User;
  questId?: string;
  layout?: 'vertical' | 'horizontal' | 'kanban' | 'paged';
  compact?: boolean;
  editable?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  loadingMore?: boolean;
  /** Expand replies for all posts */
  initialExpanded?: boolean;
  /** Board ID for context */
  boardId?: string;
  /** Currently expanded item ID */
  expandedId?: string | null;
  /** Set expanded item ID */
  onExpand?: (id: string | null) => void;
};

const defaultKanbanColumns = ['To Do', 'In Progress', 'Blocked', 'Done'];

const DraggableCard: React.FC<{
  item: Post;
  user?: User;
  compact: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  initialExpanded?: boolean;
  expandedId?: string | null;
  onExpand?: (id: string | null) => void;
  boardId?: string;
}> = ({ item, user, compact, onEdit, onDelete, initialExpanded, expandedId, onExpand, boardId }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'dragging' : ''}
      {...attributes}
      {...listeners}
    >
      <ContributionCard
        contribution={item}
        user={user}
        compact={compact}
        onEdit={onEdit}
        onDelete={onDelete}
        initialShowReplies={initialExpanded}
        boardId={boardId}
        expanded={expandedId === item.id}
        onToggleExpand={() =>
          onExpand?.(expandedId === item.id ? null : item.id)
        }
      />
    </div>
  );
};

const DroppableColumn: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 ${isOver ? 'droppable-over' : ''}`}
    >
      {children}
    </div>
  );
};

const GridLayout: React.FC<GridLayoutProps> = ({
  items,
  user,
  layout = 'vertical',
  compact = false,
  editable = false,
  onEdit,
  onDelete,
  loadingMore = false,
  initialExpanded = false,
  boardId,
  expandedId,
  onExpand,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const scrollToIndex = useCallback((i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const width = card?.offsetWidth || 0;
    el.scrollTo({ left: i * width, behavior: 'smooth' });
  }, []);
  const handlePrev = useCallback(() => {
    setIndex(i => {
      const next = Math.max(0, i - 1);
      scrollToIndex(next);
      indexRef.current = next;
      return next;
    });
  }, []);
  const handleNext = useCallback(() => {
    setIndex(i => {
      const next = Math.min(items.length - 1, i + 1);
      scrollToIndex(next);
      indexRef.current = next;
      return next;
    });
  }, [items.length]);


  /** Context for board updates is needed in several layouts. Call it here so
   *  hook order stays consistent regardless of early returns.
   */
  const { selectedBoard, updateBoardItem, removeItemFromBoard } =
    useBoardContext();


  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (layout === 'horizontal' && items.length > 0) {
      scrollToIndex(indexRef.current);
    }
  }, [layout, items.length, scrollToIndex]);
  useEffect(() => {
    if (layout !== 'paged') setPageIndex(0);
  }, [layout, items.length]);
  useEffect(() => {
    setIndex(i => Math.min(i, items.length - 1));
  }, [items.length]);
  useEffect(() => {
    const handler = (e: Event) => {
      const { detail } = e as CustomEvent<{ taskId: string }>;
      const id = detail?.taskId;
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-accent');
        setTimeout(() => el.classList.remove('ring-2', 'ring-accent'), 2000);
      }
    };
    window.addEventListener('questTaskSelect', handler as EventListener);
    return () => window.removeEventListener('questTaskSelect', handler as EventListener);
  }, []);

  useEffect(() => {
    if (layout !== 'horizontal') return;
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollLeft, clientWidth } = el;
      let closestIdx = 0;
      let closestDiff = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const node = child as HTMLElement;
        const center = node.offsetLeft + node.clientWidth / 2;
        const diff = Math.abs(center - scrollLeft - clientWidth / 2);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestIdx = i;
        }
      });
      if (closestIdx !== indexRef.current) {
        indexRef.current = closestIdx;
        setIndex(closestIdx);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [layout, items.length]);

  // Hooks used by the paged layout variant must be declared unconditionally so
  // that the hook order remains stable when the layout changes at runtime.
  const pagedContainerRef = useRef<HTMLDivElement>(null);
  const pages = useMemo(() => {
    const perPage = 6; // show 6 posts at a time (2 rows x 3 columns)
    const step = 2; // move one request column (2 posts) at a time
    if (items.length <= perPage) return [items];
    const count = Math.ceil((items.length - perPage) / step) + 1;
    return Array.from({ length: count }, (_, i) =>
      items.slice(i * step, i * step + perPage)
    );
  }, [items]);

  const pageCount = pages.length;
  useEffect(() => {
    if (pageIndex >= pageCount) setPageIndex(0);
  }, [pageCount, pageIndex]);

  const handleScroll = useCallback(() => {
    const el = pagedContainerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== pageIndex) setPageIndex(idx);
  }, [pageIndex]);

  const handlePrevPage = useCallback(() => {
    const el = pagedContainerRef.current;
    if (!el) return;
    const next = (pageIndex - 1 + pageCount) % pageCount;
    setPageIndex(next);
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  }, [pageIndex, pageCount]);

  const handleNextPage = useCallback(() => {
    const el = pagedContainerRef.current;
    if (!el) return;
    const next = (pageIndex + 1) % pageCount;
    setPageIndex(next);
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  }, [pageIndex, pageCount]);

  const visibleDots = useMemo(() => {
    const limit = Math.min(pageCount, 5);
    const start = Math.min(
      Math.max(0, pageIndex - Math.floor(limit / 2)),
      Math.max(0, pageCount - limit)
    );
    return Array.from({ length: limit }, (_, i) => start + i);
  }, [pageIndex, pageCount]);
  if (!items || items.length === 0) {
    return (
      <div className="text-center text-secondary py-12 text-sm">
        No contributions found.
      </div>
    );
  }

  /** Grouping logic for Kanban */
  const grouped = defaultKanbanColumns.reduce((acc, col) => {
    acc[col] = items.filter(
      (item) => 'status' in item && item.status === col
    );
    return acc;
  }, {} as Record<string, Post[]>);

  /** 📌 Kanban Layout */

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const dest = over.id as string;
    const dragged: Post | undefined = active.data.current?.item;
    if (!dragged || dragged.status === dest) return;

    const optimistic = { ...dragged, status: dest };
    if (selectedBoard) updateBoardItem(selectedBoard, optimistic as unknown as BoardItem);

    try {
      const updated = await updatePost(dragged.id, { status: dest });
      if (selectedBoard) updateBoardItem(selectedBoard, updated as unknown as BoardItem);
      if (dest === 'Done') {
        await archivePost(dragged.id);
        if (selectedBoard) removeItemFromBoard(selectedBoard, dragged.id);
      }
    } catch (err) {
      console.error('[GridLayout] Failed to update post status:', err);
    }
  };

  if (layout === 'kanban') {
    return (
      <DndContext
        onDragEnd={handleDragEnd}
        sensors={sensors}
        collisionDetection={closestCenter}
      >
        <div className="flex overflow-auto space-x-4 pb-4 px-2">
          {defaultKanbanColumns.map((col) => (
            <div
              key={col}
              className="min-w-[280px] w-[320px] flex-shrink-0 bg-surface border border-secondary rounded-lg p-4 shadow-sm"
            >
              <h3 className="text-sm font-bold text-secondary mb-2">
                {col} ({grouped[col].length})
              </h3>
              <DroppableColumn id={col}>
                {grouped[col].map((item) => (
                  <ErrorBoundary key={item.id}>
                    <DraggableCard
                      item={item}
                      user={user}
                      compact={true}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      boardId={boardId}
                    />
                  </ErrorBoundary>
                ))}
              </DroppableColumn>
            </div>
          ))}
          {editable && (
            <div className="min-w-[280px] w-[320px] flex items-center justify-center text-accent hover:text-accent font-medium border border-secondary rounded-lg shadow-sm bg-surface cursor-pointer">
              + Add Column
            </div>
          )}
        </div>
      </DndContext>
    );
  }

  /** 📌 Horizontal Grid Layout */
  if (layout === 'horizontal') {
    return (
      <div className="relative">
        <div
          ref={containerRef}
          className="flex overflow-x-auto gap-4 snap-x snap-mandatory px-2 pb-4 scroll-smooth"
        >
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={
                'snap-center flex-shrink-0 w-64 sm:w-[300px] transition-transform duration-300 ' +
                (idx === index
                  ? 'scale-100'
                  : Math.abs(idx - index) === 1
                  ? 'scale-95 opacity-80'
                  : 'scale-90 opacity-50')
              }
            >
              <ContributionCard
                contribution={item}
                user={user}
                compact={compact || idx !== index}
                onEdit={onEdit}
                onDelete={onDelete}
                initialShowReplies={initialExpanded}
                boardId={boardId}
                expanded={expandedId === item.id}
                onToggleExpand={() =>
                  onExpand?.(expandedId === item.id ? null : item.id)
                }
              />
            </div>
          ))}
        </div>
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-surface hover:bg-background rounded-full shadow p-1 transition-colors"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-surface hover:bg-background rounded-full shadow p-1 transition-colors"
            >
              ▶
            </button>
            <div className="flex justify-center mt-2">
              {(() => {
                const dots = items.length > 3 ? [index - 1, index, index + 1] : items.map((_, i) => i);
                return dots.map((i, idx) => {
                  const actual = ((i % items.length) + items.length) % items.length;
                  const isActive = actual === index;
                  const isEdge = idx === 0 || idx === dots.length - 1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setIndex(actual)}
                      className={
                        'mx-1 w-2 h-2 rounded-full transition-all ' +
                        (isActive ? 'bg-accent opacity-100' : 'bg-secondary/40 opacity-70') +
                        (isEdge && !isActive ? ' scale-75' : '')
                      }
                    />
                  );
                });
              })()}
            </div>
          </>
        )}
        {loadingMore && <Spinner />}
      </div>
    );
  }

  /** 📌 Paged Grid Layout */
  if (layout === 'paged') {
    return (
      <div className="space-y-2">
        <div className="relative">
          <div
            ref={pagedContainerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
          >
            {pages.map((group, idx) => (
              <div
                key={idx}
                className="grid grid-cols-3 gap-6 px-2 flex-shrink-0 w-full snap-center"
              >
                {group.map(item => (
                <ContributionCard
                  key={item.id}
                  contribution={item}
                  user={user}
                  compact={compact}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  initialShowReplies={initialExpanded}
                  boardId={boardId}
                  expanded={expandedId === item.id}
                  onToggleExpand={() =>
                    onExpand?.(expandedId === item.id ? null : item.id)
                  }
                />
              ))}
            </div>
          ))}
          </div>
          {pageCount > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPage}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-surface hover:bg-background rounded-full shadow p-1"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-surface hover:bg-background rounded-full shadow p-1"
              >
                ▶
              </button>
            </>
          )}
        </div>
        {pageCount > 1 && (
          <div className="flex justify-center mt-2 gap-2">
            {visibleDots.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const el = pagedContainerRef.current;
                  if (!el) return;
                  setPageIndex(i);
                  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                }}
                className={`w-3 h-1 rounded-sm transition-colors ${
                  pageIndex === i ? 'bg-accent' : 'bg-background'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  /** 📌 Vertical Grid Layout (default) */
  const isSingle = items.length === 1;
  const isPair = items.length === 2;

  if (layout === 'vertical' && items.length > 6) {
    const handlePrev = () => containerRef.current?.scrollBy({ top: -200, behavior: 'smooth' });
    const handleNext = () => containerRef.current?.scrollBy({ top: 200, behavior: 'smooth' });
    return (
      <div className="relative">
        <div ref={containerRef} className="max-h-96 overflow-y-auto space-y-4 px-2 pb-4 scroll-smooth">
          {items.map((item) => (
          <ContributionCard
            key={item.id}
            contribution={item}
            user={user}
            compact={compact}
            onEdit={onEdit}
            onDelete={onDelete}
            initialShowReplies={initialExpanded}
            boardId={boardId}
            expanded={expandedId === item.id}
            onToggleExpand={() =>
              onExpand?.(expandedId === item.id ? null : item.id)
            }
          />
          ))}
          {loadingMore && <Spinner />}
        </div>
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-1/2 -translate-x-1/2 -top-2 bg-surface hover:bg-background rounded-full shadow p-1 transition-colors"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-surface hover:bg-background rounded-full shadow p-1 transition-colors"
        >
          ▼
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        isSingle
          ? 'flex justify-center items-start p-2'
          : isPair
            ? 'grid grid-cols-1 sm:grid-cols-2 gap-6 px-2'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2'
      }
    >
      {items.map((item) => (
        <div key={item.id} className={isSingle ? 'max-w-prose w-full' : ''}>
          <ContributionCard
            contribution={item}
            user={user}
            compact={compact}
            onEdit={onEdit}
            onDelete={onDelete}
            initialShowReplies={initialExpanded}
            boardId={boardId}
            expanded={expandedId === item.id}
            onToggleExpand={() =>
              onExpand?.(expandedId === item.id ? null : item.id)
            }
          />
        </div>
      ))}
      {loadingMore && <Spinner />}
    </div>
  );
};

export default GridLayout;
