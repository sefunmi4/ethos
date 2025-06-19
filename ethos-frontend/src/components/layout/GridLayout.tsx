import React, { useRef, useState, useEffect, useCallback } from 'react';
import ContributionCard from '../contribution/ContributionCard';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
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
  layout?: 'vertical' | 'horizontal' | 'kanban';
  compact?: boolean;
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
  onEdit,
  onDelete,
  onScrollEnd,
  loadingMore = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
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

  useEffect(() => {
    if (layout === 'horizontal') {
      scrollToIndex(index);
    }
  }, [layout, index, scrollToIndex]);
  useEffect(() => {
    const handler = (e: any) => {
      const id = e.detail?.taskId;
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-blue-500');
        setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500'), 2000);
      }
    };
    window.addEventListener('questTaskSelect', handler);
    return () => window.removeEventListener('questTaskSelect', handler);
  }, []);
  if (!items || items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12 text-sm">
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
  const { selectedBoard, updateBoardItem } = useBoardContext();

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
        try {
          await archivePost(dragged.id);
        } catch (err) {
          console.error('[GridLayout] Failed to archive post:', err);
        }
      }
    } catch (err) {
      console.error('[GridLayout] Failed to update post status:', err);
    }
  };

  if (layout === 'kanban') {
    return (
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex overflow-auto space-x-4 pb-4 px-2">
          {defaultKanbanColumns.map((col) => (
            <div
              key={col}
              className="min-w-[280px] w-[320px] flex-shrink-0 bg-gray-50 border rounded-lg p-4 shadow-sm"
            >
              <h3 className="text-sm font-bold text-gray-600 mb-4">{col}</h3>
              <DroppableColumn id={col}>
                {grouped[col].map((item) => (
                  <DraggableCard
                    key={item.id}
                    item={item}
                    user={user}
                    compact={compact}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </DroppableColumn>
            </div>
          ))}
          <div className="min-w-[280px] w-[320px] flex items-center justify-center text-blue-500 hover:text-blue-700 font-medium border rounded-lg shadow-sm bg-white cursor-pointer">
            + Add Column
          </div>
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
          {items.map((item) => (
            <div key={item.id} className="snap-center min-w-[280px] flex-shrink-0">
              <ContributionCard
                contribution={item}
                user={user}
                compact={compact}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
        {items.length > 3 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 rounded-full shadow p-1"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 rounded-full shadow p-1"
            >
              ▶
            </button>
            <div className="flex justify-center mt-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`mx-1 w-2 h-2 rounded-full ${i === index ? 'bg-blue-600' : 'bg-gray-300'} focus:outline-none`}
                />
              ))}
            </div>
          </>
        )}
        {loadingMore && <Spinner />}
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
          className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white dark:bg-gray-700 rounded-full shadow p-1"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-white dark:bg-gray-700 rounded-full shadow p-1"
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