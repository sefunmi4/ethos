import React from 'react';
import ContributionCard from '../contribution/ContrubitionCard'; // Optional fallback

/**
 * GridRenderer
 * Renders contributions in an adaptive column layout (2 to 4 columns).
 *
 * This is ideal for visual browsing of many items such as boards, project cards,
 * or post collections. Used by boards with structure === 'grid'.
 *
 * @param {Object[]} items - Array of contribution-like objects.
 * @param {Object} user - Current user for permissions or personalization.
 * @param {Function} onEdit - Optional callback for editing.
 * @param {Function} onDelete - Optional callback for deleting.
 */
const GridRenderer = ({ items = [], user, onEdit, onDelete }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12 text-sm">
        No contributions found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ContributionCard
          key={item.id}
          contribution={item}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default GridRenderer;