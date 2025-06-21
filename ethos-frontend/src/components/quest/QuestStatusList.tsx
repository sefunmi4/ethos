import React, { useEffect, useState } from 'react';
import { fetchPostsByQuestId } from '../../api/post';
import { STATUS_OPTIONS } from '../../constants/options';
import type { Quest } from '../../types/questTypes';
import type { Post } from '../../types/postTypes';
import StatusBadge from '../ui/StatusBadge';

interface QuestStatusListProps {
  quest: Quest;
}

/**
 * Displays quest tasks grouped by status in vertical collapsible sections.
 */
const QuestStatusList: React.FC<QuestStatusListProps> = ({ quest }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPostsByQuestId(quest.id)
      .then(setPosts)
      .catch(err => console.error('[QuestStatusList] failed to load posts', err));
  }, [quest.id]);

  const grouped = STATUS_OPTIONS.reduce<Record<string, Post[]>>((acc, opt) => {
    acc[opt.value] = posts.filter(p => p.status === opt.value);
    return acc;
  }, {} as Record<string, Post[]>);

  const toggle = (status: string) =>
    setOpen(prev => ({ ...prev, [status]: !prev[status] }));

  return (
    <div className="space-y-3 max-h-[70vh] overflow-auto p-2">
      {STATUS_OPTIONS.map(({ value }) => (
        <div key={value} className="border border-secondary rounded bg-surface">
          <button
            type="button"
            onClick={() => toggle(value)}
            className="w-full flex justify-between items-center p-2 text-left"
          >
            <span className="font-semibold flex items-center gap-1">
              {value}
            </span>
            <span className="text-xs text-secondary">
              {grouped[value].length} {open[value] ? '▲' : '▼'}
            </span>
          </button>
          {open[value] && (
            <div className="p-2 space-y-2">
              {grouped[value].length === 0 ? (
                <div className="text-sm text-secondary">No items</div>
              ) : (
                grouped[value].map(post => (
                  <div
                    key={post.id}
                    className="text-xs border border-secondary rounded p-2 bg-background space-y-1"
                  >
                    <div className="font-semibold text-sm">{post.content}</div>
                    {post.status && <StatusBadge status={post.status} />}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuestStatusList;
