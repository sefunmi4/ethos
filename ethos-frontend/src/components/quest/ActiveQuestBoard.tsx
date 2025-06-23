import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchActiveQuests } from '../../api/quest';
import { fetchRecentPosts, fetchPostById } from '../../api/post';
import QuestCard from './QuestCard';
import CreateQuest from './CreateQuest';
import { Spinner, Button } from '../ui';
import { BOARD_PREVIEW_LIMIT } from '../../constants/pagination';
import type { Quest } from '../../types/questTypes';
import type { Post } from '../../types/postTypes';

interface QuestWithLog extends Quest {
  lastLog?: Post;
}

const ActiveQuestBoard: React.FC = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<QuestWithLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        const [quests, recent] = await Promise.all([
          // Fetch all active quests. Passing a userId would exclude
          // quests the current user participates in, which leads to
          // an empty board when all quests belong to this user.
          fetchActiveQuests(),
          // Recent posts from any user help identify the latest log
          // entry for each quest.
          fetchRecentPosts(undefined, 1),
        ]);
        const questMap: Record<string, QuestWithLog> = {};
        quests.forEach(q => {
          questMap[q.id] = { ...q };
        });
        recent.forEach(p => {
          if (!p.questId || !questMap[p.questId]) return;
          const current = questMap[p.questId];
          if (
            !current.lastLog ||
            (p.createdAt || p.timestamp) > (current.lastLog?.createdAt || current.lastLog?.timestamp || '')
          ) {
            questMap[p.questId] = { ...current, lastLog: p };
          }
        });

        await Promise.all(
          quests.map(async q => {
            if (!questMap[q.id].lastLog && q.headPostId) {
              try {
                const head = await fetchPostById(q.headPostId);
                questMap[q.id].lastLog = head;
              } catch {
                /* ignore errors fetching head post */
              }
            }
          })
        );

        const enriched = Object.values(questMap);
        setQuests(enriched);
      } catch (err) {
        console.warn('[ActiveQuestBoard] Failed to load quests', err);
        setQuests([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const scrollToIndex = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement | undefined;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const updateIndex = (delta: number) => {
    setIndex(prev => {
      const next = (prev + delta + quests.length) % quests.length;
      scrollToIndex(next);
      indexRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    scrollToIndex(index);
    indexRef.current = index;
  }, [index]);

  // Update index when user scrolls manually
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollLeft, clientWidth } = el;
      let closestIdx = 0;
      let closestDiff = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const node = child as HTMLElement;
        const center = node.offsetLeft + node.clientWidth / 2;
        const diff = Math.abs(center - scrollLeft - clientWidth / 2);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestIdx = i;
        }
      });
      if (closestIdx !== indexRef.current) {
        indexRef.current = closestIdx;
        setIndex(closestIdx);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [quests]);

  const handleCreateSave = (quest: Quest) => {
    setQuests(q => [quest, ...q]);
    setShowCreate(false);
  };

  if (!user) return null;
  if (loading) return <Spinner />;
  if (quests.length === 0) return null;

  const showSeeAll = quests.length > BOARD_PREVIEW_LIMIT;

  return (
    <div className="space-y-4 bg-background p-4 rounded shadow-md">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">🧭 Active Quests</h2>
        {user && (
          <Button
            variant="contrast"
            size="sm"
            onClick={() => setShowCreate((p) => !p)}
          >
            {showCreate ? '- Cancel Quest' : '+ Add Quest'}
          </Button>
        )}
      </div>
      {showCreate && (
        <div className="border rounded-lg p-4 shadow">
          <CreateQuest
            onSave={handleCreateSave}
            onCancel={() => setShowCreate(false)}
            boardId="quest-board"
          />
        </div>
      )}
      <div className="relative">
        <div
          ref={containerRef}
          className="flex overflow-x-auto gap-4 snap-x snap-mandatory px-2 pb-4 scroll-smooth"
        >
          {quests.map((q, idx) => (
            <div
              key={q.id}
              className={
                'snap-center flex-shrink-0 w-[90%] sm:w-[850px] transition-transform duration-300 ' +
                (idx === index
                  ? 'scale-100'
                  : Math.abs(idx - index) === 1
                  ? 'scale-95 opacity-80'
                  : 'scale-90 opacity-50')
              }
            >
              <QuestCard quest={q} user={user} />
            </div>
          ))}
        </div>
        {quests.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => updateIndex(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-surface hover:bg-background rounded-full shadow p-1"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => updateIndex(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-surface hover:bg-background rounded-full shadow p-1"
            >
              ▶
            </button>
          </>
        )}
      </div>
      <div className="flex justify-center mt-2">
        {(() => {
          const dots = quests.length > 3 ? [index - 1, index, index + 1] : quests.map((_, i) => i);
          return dots.map((i, idx) => {
            const actual = ((i % quests.length) + quests.length) % quests.length;
            const isActive = actual === index;
            const isEdge = idx === 0 || idx === dots.length - 1;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setIndex(actual)}
                className={
                  'mx-1 w-2 h-2 rounded-full transition-all ' +
                  (isActive ? 'bg-accent opacity-100' : 'bg-secondary/40 opacity-70') +
                  (isEdge && !isActive ? ' scale-75' : '')
                }
              />
            );
          });
        })()}
      </div>
    </div>

  );
};

export default ActiveQuestBoard;
