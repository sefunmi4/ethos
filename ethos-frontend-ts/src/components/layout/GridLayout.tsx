import React from 'react';
import ContributionCard from '../contribution/ContributionCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

type GridLayoutProps = {
  items: Post[];
  questId: string;
  user?: User;
  layout?: 'vertical' | 'horizontal' | 'kanban';
  compact?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

const defaultKanbanColumns = ['To Do', 'In Progress', 'Done'];

const GridLayout: React.FC<GridLayoutProps> = ({
  items,
  questId,
  user,
  layout = 'vertical',
  compact = false,
  onEdit,
  onDelete,
}) => {
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
      (item) => 'status' in item && (item.status === col)
    );
    return acc;
  }, {} as Record<string, Post[]>);

  /** 📌 Kanban Layout */
  if (layout === 'kanban') {
    return (
      <div className="flex overflow-auto space-x-4 pb-4 px-2">
        {defaultKanbanColumns.map((col) => (
          <div
            key={col}
            className="min-w-[280px] w-[320px] flex-shrink-0 bg-gray-50 border rounded-lg p-4 shadow-sm"
          >
            <h3 className="text-sm font-bold text-gray-600 mb-4">{col}</h3>
            <div className="flex flex-col gap-4">
              {grouped[col].map((item) => (
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
          </div>
        ))}
        <div className="min-w-[280px] w-[320px] flex items-center justify-center text-blue-500 hover:text-blue-700 font-medium border rounded-lg shadow-sm bg-white cursor-pointer">
          + Add Column
        </div>
      </div>
    );
  }

  /** 📌 Horizontal Grid Layout */
  if (layout === 'horizontal') {
    return (
      <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory px-2 pb-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="snap-start min-w-[280px] flex-shrink-0"
          >
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
    );
  }

  /** 📌 Vertical Grid Layout (default) */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
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
    </div>
  );
};

export default GridLayout;