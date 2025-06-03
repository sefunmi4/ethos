import React from 'react';
import ContributionCard from '../contribution/ContributionCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

type GridLayoutProps = {
  items: Post[];
  user?: User;
  layout?: 'vertical' | 'horizontal' | 'kanban';
  compact?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

/**
 * GridLayout Component
 * 
 * - Displays a list of contributions in a flexible layout.
 * - Defaults to vertical grid (2–4 columns based on screen size).
 * - Supports horizontal scroll with snap or Kanban-style columns.
 *
 * Layout Modes:
 * - 'vertical': standard responsive grid
 * - 'horizontal': scrollable row with snap alignment
 * - 'kanban': column-based board with default stages and drag potential
 */
const GridLayout: React.FC<GridLayoutProps> = ({
  items,
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

  // Default Kanban buckets (To Do, In Progress, Done)
  const defaultColumns = ['To Do', 'In Progress', 'Done'];

  // Group items by status (assuming `item.status` exists)
  const groupedItems = defaultColumns.reduce((acc, col) => {
    acc[col] = items.filter(
      (item) => 'status' in item && (item as any).status === col
    );
    return acc;
  }, {} as Record<string, Post[]>);

  // Kanban Layout
  if (layout === 'kanban') {
    return (
      <div className="flex overflow-auto space-x-6 pb-4">
        {defaultColumns.map((col) => (
          <div
            key={col}
            className="min-w-[280px] w-[300px] flex-shrink-0 snap-start bg-gray-50 border rounded-md p-3 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{col}</h3>
            <div className="flex flex-col gap-3">
              {groupedItems[col].map((item) => (
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
        {/* Add Column Button (mockup) */}
        <div className="min-w-[280px] w-[300px] flex items-center justify-center bg-white border rounded-md shadow-sm hover:bg-gray-100 cursor-pointer">
          <span className="text-blue-600 font-medium">+ Add Column</span>
        </div>
      </div>
    );
  }

  // Horizontal Layout
  if (layout === 'horizontal') {
    return (
      <div className="flex overflow-x-auto space-x-4 snap-x snap-mandatory px-2 pb-4">
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

  // Vertical Grid (default)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
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