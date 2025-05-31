// src/components/ui/LinkedItemDisplay.jsx
import React from 'react';

const LinkedItemDisplay = ({ item }) => {
  if (!item || !item.id) return null;

  const { title, nodeId, type = 'Item' } = item;

  return (
    <div className="text-sm text-green-700 bg-green-50 border border-green-300 p-2 rounded">
      Linked to: <strong>{title || `Untitled ${type}`}</strong>
      {typeof nodeId === 'number' && <> · Node #{nodeId}</>}
    </div>
  );
};

export default LinkedItemDisplay;