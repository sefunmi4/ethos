import React, { useEffect, useRef } from 'react';
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onScrollEnd) return;
    const handle = () => {
      if (el.scrollHeight - el.scrollTop <= el.clientHeight + 150) {
        onScrollEnd();
      }
    };
    el.addEventListener('scroll', handle);
    return () => el.removeEventListener('scroll', handle);
  }, [onScrollEnd]);

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
        />
      ))}
      {loadingMore && <Spinner />}
    </div>
  );
};

export default ListLayout;
