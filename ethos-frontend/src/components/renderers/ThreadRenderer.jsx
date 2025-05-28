import React from 'react';
import ContributionCard from '../contribution/ContrubitionCard'; // Optional fallback

/**
 * ThreadRenderer.jsx
 * Recursively renders nested replies based on parent-child relationships.
 * Used by post threads and as a fallback for quest or project timeline breakdowns.
 * 
 * @param {Object[]} contributions - Array of post-like objects.
 * @param {string|null} parentId - The current parent ID to match children to.
 * @param {Object} user - Authenticated user (used for permissions).
 * @param {Function} onEdit - Optional edit callback.
 * @param {Function} onDelete - Optional delete callback.
 */
const ThreadRenderer = ({
  contributions = [],
  parentId = null,
  user,
  onEdit,
  onDelete
}) => {
  const childItems = contributions.filter(item => item.parentPostId === parentId);

  if (childItems.length === 0) return null;

  return (
    <div className={parentId ? 'ml-4 border-l-2 border-gray-200 pl-4' : ''}>
      {childItems.map((contribution) => (
        <div key={contribution.id} className="mb-4">
          <ContributionCard
            contribution={contribution}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          <ThreadRenderer
            contributions={contributions}
            parentId={contribution.id}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
};

export default ThreadRenderer;
