import React, { useEffect, useState } from 'react';
import type { LinkedItem, Post } from '../../types/postTypes';
import { fetchQuestById } from '../../api/quest';
import { fetchPostById } from '../../api/post';
import { getQuestLinkLabel } from '../../utils/displayUtils';
import { ROUTES } from '../../constants/routes';
import { FaExpand, FaCompress } from 'react-icons/fa';
import SummaryTag from './SummaryTag';
import type { SummaryTagType } from './SummaryTag';

interface LinkViewerProps {
  items: LinkedItem[];
  /** Post to resolve parent chain for */
  post?: Post;
  /** Fetch and show reply chain */
  showReplyChain?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Toggle handler when using controlled open state */
  onToggle?: () => void;
}

const LinkViewer: React.FC<LinkViewerProps> = ({ items, post, showReplyChain, open: openProp, onToggle }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;
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

  const getTagType = (p: Post): SummaryTagType => {
    if (p.type === 'quest_log') return 'log';
    return (p.type as SummaryTagType) || 'type';
  };

  const uniqueChain = chain.reduce<
    Array<{
      post: Post;
      label: string;
      username: string;
    }>
  >((acc, p) => {
    const label = getQuestLinkLabel(p);
    if (!acc.some((u) => u.label === label)) {
      const username = p.author?.username || p.authorId;
      acc.push({ post: p, label, username });
    }
    return acc;
  }, []);

  return (
    <div className="text-xs text-primary dark:text-primary">
      <button
        onClick={() => {
          if (controlled) {
            onToggle?.();
          } else {
            setInternalOpen(o => !o);
          }
        }}
        className="flex items-center gap-1 text-blue-600 underline"
      >
        {open ? <FaCompress /> : <FaExpand />} {open ? 'Collapse Details' : 'Expand Details'}
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
          {uniqueChain.length > 0 && (
            <div>
              <div className="font-semibold capitalize mb-1">reply chain</div>
              <div className="flex flex-wrap gap-1">
                {uniqueChain.map(({ post: p, label, username }) => (
                  <SummaryTag
                    key={p.id}
                    type={getTagType(p)}
                    label={label}
                    detailLink={ROUTES.POST(p.id)}
                    username={username}
                    usernameLink={ROUTES.PUBLIC_PROFILE(p.authorId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LinkViewer;
