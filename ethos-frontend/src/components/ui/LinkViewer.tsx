import React, { useState } from 'react';
import type { LinkedItem } from '../../types/postTypes';

interface LinkViewerProps {
  items: LinkedItem[];
}

const LinkViewer: React.FC<LinkViewerProps> = ({ items }) => {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;

  const grouped = items.reduce<Record<string, LinkedItem[]>>((acc, item) => {
    const key = item.linkType || 'other';
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-blue-600 underline"
      >
        {open ? 'Hide Links' : `Links (${items.length})`}
      </button>
      {open && (
        <div className="mt-2 border rounded bg-gray-50 p-2 space-y-1">
          {Object.entries(grouped).map(([type, list]) => (
            <div key={type}>
              <div className="font-semibold capitalize mb-1">{type}</div>
              <ul className="pl-4 list-disc space-y-1">
                {list.map((l) => (
                  <li key={l.itemId}>
                    {l.title || l.itemId}
                    {l.nodeId && `:${l.nodeId}`}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LinkViewer;
