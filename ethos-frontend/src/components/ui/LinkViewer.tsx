import React, { useEffect, useState } from 'react';
import type { LinkedItem } from '../../types/postTypes';
import { fetchQuestById } from '../../api/quest';
import { fetchPostById } from '../../api/post';

interface LinkViewerProps {
  items: LinkedItem[];
}

const LinkViewer: React.FC<LinkViewerProps> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState<LinkedItem[]>(items);

  useEffect(() => {
    const resolve = async () => {
      const updated = await Promise.all(
        items.map(async (item) => {
          try {
            if (!item.itemId) {
              return item;
            }
            if (item.itemType === 'quest') {
              const q = await fetchQuestById(item.itemId);
              return { ...item, title: q.title };
            }
            if (item.itemType === 'post') {
              const p = await fetchPostById(item.itemId);
              return { ...item, title: p.nodeId || p.content?.slice(0, 30) };
            }
          } catch {
            /* ignore resolution errors */
          }
          return item;
        })
      );
      setResolved(updated);
    };
    resolve();
  }, [items]);

  if (!resolved || resolved.length === 0) return null;

  const grouped = resolved.reduce<Record<string, LinkedItem[]>>((acc, item) => {
    const key = item.linkType || 'other';
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="text-xs text-gray-900 dark:text-gray-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-blue-600 underline"
      >
        {open ? 'Hide Links' : `Links (${items.length})`}
      </button>
      {open && (
        <div className="mt-2 border rounded bg-gray-50 dark:bg-gray-700 p-2 space-y-1">
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
