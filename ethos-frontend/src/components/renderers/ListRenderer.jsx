import React from 'react';
import ContributionCard from '../contribution/ContrubitionCard'; // Optional fallback

/**
 * ListRenderer
 * Renders an array of contributions in a vertical layout.
 *
 * Acts as the default/fallback layout if no structure is defined.
 * Can be used by boards or feed views to simply show all items top-down.
 *
 * @param {Object[]} items - Array of contribution-like objects.
 * @param {Object} user - Current user (for permission/display logic).
 * @param {boolean} compact - If true, uses compact card style.
 * @param {Function} onEdit - Optional handler for editing a contribution.
 * @param {Function} onDelete - Optional handler for removing a contribution.
 */
const ListRenderer = ({ items = [], user, compact = false, onEdit, onDelete }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12 text-sm">
        No contributions to display.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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

export default ListRenderer;