import React from 'react';
import { useScrollEnd } from '../../hooks/useScrollEnd';
import ContributionCard from '../contribution/ContributionCard';
import { Spinner } from '../ui';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface ListLayoutProps {
  items: Post[];
  questId: string;
  user?: User;
  compact?: boolean;
  editable?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onScrollEnd?: () => void;
  loadingMore?: boolean;
  headerOnly?: boolean;
  /** Expand replies for all posts */
  initialExpanded?: boolean;
  /** Board ID for context */
  boardId?: string;
  expandedId?: string | null;
  onExpand?: (id: string | null) => void;
}

const ListLayout: React.FC<ListLayoutProps> = ({
  items,
  questId,
  user,
  compact = false,
  onEdit,
  onDelete,
  onScrollEnd,
  loadingMore = false,
  headerOnly = false,
  initialExpanded = false,
  boardId,
  expandedId,
  onExpand,
}) => {
  const containerRef = useScrollEnd<HTMLDivElement>(onScrollEnd);

  if (!items || items.length === 0) {
    return (
      <div className="text-center text-secondary py-12 text-sm">
        No contributions found.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="space-y-4 overflow-y-auto max-h-[80vh] px-2"
    >
      {items.map((item) => (
        <ContributionCard
          key={item.id}
          contribution={item}
          user={user}
          compact={compact}
          onEdit={onEdit}
          onDelete={onDelete}
          questId={questId}
          headerOnly={headerOnly}
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
  );
};

export default ListLayout;
