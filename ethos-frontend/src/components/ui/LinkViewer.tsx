import React, { useEffect, useState } from 'react';
import type { LinkedItem, Post } from '../../types/postTypes';
import { fetchQuestById } from '../../api/quest';
import { fetchPostById } from '../../api/post';
import { getQuestLinkLabel } from '../../utils/displayUtils';

interface LinkViewerProps {
  items: LinkedItem[];
  /** Post to resolve parent chain for */
  post?: Post;
  /** Fetch and show reply chain */
  showReplyChain?: boolean;
}

const LinkViewer: React.FC<LinkViewerProps> = ({ items, post, showReplyChain }) => {
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState<LinkedItem[]>(items);
  const [chain, setChain] = useState<Post[]>([]);

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

  useEffect(() => {
    const loadChain = async () => {
      if (!showReplyChain || !post?.replyTo) {
        setChain([]);
        return;
      }
      const visited = new Set<string>();
      const posts: Post[] = [];
      let current = post.replyTo;
      while (current && !visited.has(current)) {
        try {
          const p = await fetchPostById(current);
          posts.push(p);
          visited.add(current);
          current = p.replyTo ?? undefined;
        } catch {
          break;
        }
      }
      setChain(posts);
    };
    loadChain();
  }, [post, showReplyChain]);

  if (resolved.length === 0 && chain.length === 0) return null;

  const grouped = resolved.reduce<Record<string, LinkedItem[]>>((acc, item) => {
    const key = item.linkType || 'other';
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="text-xs text-primary dark:text-primary">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-blue-600 underline"
      >
        {open ? 'Collapse Details' : 'Expand Details'}
      </button>
      {open && (
        <div className="mt-2 border rounded bg-background dark:bg-surface p-2 space-y-1">
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
          {chain.length > 0 && (
            <div>
              <div className="font-semibold capitalize mb-1">reply chain</div>
              <ul className="pl-4 list-disc space-y-1">
                {Array.from(new Set(chain.map(p => getQuestLinkLabel(p)))).map((label, idx) => (
                  <li key={idx}>{label}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LinkViewer;
