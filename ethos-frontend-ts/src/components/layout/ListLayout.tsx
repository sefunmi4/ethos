// src/components/layout/ListLayout.tsx

import React from 'react';
import ContributionCard from '../contribution/ContributionCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

type LayoutProps = {
  items: Post[];
  user?: User;
  compact?: boolean;
  horizontal?: boolean; // Optional scroll direction override
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

/**
 * ListLayout Component
 *
 * Renders a scrollable list of contributions using vertical (default)
 * or horizontal layout. When horizontal, items "snap" into position 
 * for a carousel-like effect. Designed for Board or Feed views.
 *
 * @param {Post[]} items - List of posts to render
 * @param {User} user - Optional current user for permissions
 * @param {boolean} compact - Optional compact card view toggle
 * @param {boolean} horizontal - If true, scrolls horizontally with snap effect
 * @param {Function} onEdit - Optional callback for editing a post
 * @param {Function} onDelete - Optional callback for deleting a post
 */
const ListLayout: React.FC<LayoutProps> = ({
  items,
  user,
  compact = false,
  horizontal = false,
  onEdit,
  onDelete,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12 text-sm">
        No contributions to display.
      </div>
    );
  }

  return (
    <div
      className={`overflow-auto ${
        horizontal
          ? 'flex flex-row gap-4 snap-x snap-mandatory px-4 pb-4'
          : 'flex flex-col gap-4'
      }`}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={horizontal ? 'snap-start min-w-[300px]' : ''}
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
};

export default ListLayout;