// src/components/layout/ThreadLayout.tsx
import React from 'react';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import ContributionCard from '../contribution/ContributionCard';

interface ThreadLayoutProps {
  contributions: Post[];
  parentId?: string | null;
  user?: User;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  depth?: number;
  maxDepth?: number;
}

/**
 * Recursively renders a nested thread of contributions, such as replies, quest tasks,
 * or subproblems. Used for visualizing trees of linked posts with interaction support.
 */
const ThreadLayout: React.FC<ThreadLayoutProps> = ({
  contributions = [],
  parentId = null,
  user,
  onEdit,
  onDelete,
  depth = 0,
  maxDepth = 10,
}) => {
  const childItems = contributions.filter(
    (item) => item.replyTo === parentId || item.repostedFrom?.originalPostId === parentId
  );

  if (childItems.length === 0 || depth > maxDepth) return null;

  return (
    <div className={depth > 0 ? 'ml-4 border-l-2 border-gray-200 pl-4' : ''}>
      {childItems.map((contribution) => (
        <div key={contribution.id} className="mb-4">
          <ContributionCard
            contribution={contribution}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
          />

          {/* Recursively render children */}
          <ThreadLayout
            contributions={contributions}
            parentId={contribution.id}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            depth={depth + 1}
            maxDepth={maxDepth}
          />
        </div>
      ))}
    </div>
  );
};

export default ThreadLayout;