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
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { Spinner } from '../ui';

type GridLayoutProps = {
  items: Post[];
  questId: string;
  user?: User;
  layout?: 'vertical' | 'horizontal' | 'kanban' | 'paged';
  compact?: boolean;
  editable?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onScrollEnd?: () => void;
  loadingMore?: boolean;
};

const defaultKanbanColumns = ['To Do', 'In Progress', 'Blocked', 'Done'];

const DraggableCard: React.FC<{
  item: Post;
  user?: User;
  compact: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}> = ({ item, user, compact, onEdit, onDelete }) => {
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
  questId,
  user,
  layout = 'vertical',
  compact = false,
  editable = false,
  onEdit,
  onDelete,
  onScrollEnd,
  loadingMore = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const handlePrev = useCallback(
    () => setIndex((i) => Math.max(0, i - 1)),
    []
  );
  const handleNext = useCallback(
    () => setIndex((i) => Math.min(items.length - 1, i + 1)),
    [items.length]
  );

  /** Context for board updates is needed in several layouts. Call it here so
   *  hook order stays consistent regardless of early returns.
   */
  const { selectedBoard, updateBoardItem, removeItemFromBoard } =
    useBoardContext();

  useEffect(() => {
    if (layout === 'horizontal') {
      scrollToIndex(index);
    }
  }, [layout, index, scrollToIndex]);
  useEffect(() => {
    if (layout !== 'paged') setPageIndex(0);
  }, [layout, items.length]);
  useEffect(() => {
    setIndex(i => Math.min(i, items.length - 1));
  }, [items.length]);
  useEffect(() => {
    const handler = (e: any) => {
      const id = e.detail?.taskId;
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-accent');
        setTimeout(() => el.classList.remove('ring-2', 'ring-accent'), 2000);
      }
    };
    window.addEventListener('questTaskSelect', handler);
    return () => window.removeEventListener('questTaskSelect', handler);
  }, []);
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
    if (selectedBoard) updateBoardItem(selectedBoard, optimistic);

    try {
      const updated = await updatePost(dragged.id, { status: dest });
      if (selectedBoard) updateBoardItem(selectedBoard, updated);
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
              <h3 className="text-sm font-bold text-secondary mb-4">{col}</h3>
              <DroppableColumn id={col}>
                {grouped[col].map((item) => (
                  <DraggableCard
                    key={item.id}
                    item={item}
                    user={user}
                    compact={true}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
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
              className={`snap-center flex-shrink-0 transition-all ${idx === index ? 'w-full sm:w-[640px]' : 'w-64 sm:w-[300px] opacity-80'}`}
            >
              <ContributionCard
                contribution={item}
                user={user}
                compact={compact || idx !== index}
                onEdit={onEdit}
                onDelete={onDelete}
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
                      className={`mx-1 w-2 h-2 rounded-full ${isActive ? 'bg-accent' : 'bg-background'} ${isEdge && !isActive ? 'opacity-50' : ''} focus:outline-none`}
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
    const container = useRef<HTMLDivElement>(null);
    const pages = useMemo(() => {
      const count = Math.ceil(items.length / 6);
      return Array.from({ length: count }, (_, i) =>
        items.slice(i * 6, i * 6 + 6)
      );
    }, [items]);

    const pageCount = pages.length;
    useEffect(() => {
      if (pageIndex >= pageCount) setPageIndex(0);
    }, [pageCount, pageIndex]);

    const handleScroll = useCallback(() => {
      const el = container.current;
      if (!el) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      if (idx !== pageIndex) setPageIndex(idx);
    }, [pageIndex]);

    const visibleDots = useMemo(() => {
      const limit = Math.min(pageCount, 4);
      const start = Math.min(
        Math.max(0, pageIndex - Math.floor(limit / 2)),
        Math.max(0, pageCount - limit)
      );
      return Array.from({ length: limit }, (_, i) => start + i);
    }, [pageIndex, pageCount]);

    return (
      <div className="space-y-2">
        <div
          ref={container}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
        >
          {pages.map((group, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2 flex-shrink-0 w-full snap-center"
            >
              {group.map(item => (
                <ContributionCard
                  key={item.id}
                  contribution={item}
                  user={user}
                  compact={compact}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ))}
        </div>
        {pageCount > 1 && (
          <div className="flex justify-center mt-2 gap-2">
            {visibleDots.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const el = container.current;
                  if (!el) return;
                  setPageIndex(i);
                  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
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
          />
        </div>
      ))}
      {loadingMore && <Spinner />}
    </div>
  );
};

export default GridLayout;
