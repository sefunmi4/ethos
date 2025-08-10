import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchActiveQuestBoard } from '../../api/quest';
import { fetchRecentPosts, fetchPostById } from '../../api/post';
import QuestCard from './QuestCard';
import CreateQuest from './CreateQuest';
import { Spinner, Button, ErrorBoundary } from '../ui';
import TaskCard from './TaskCard';
import type { Quest } from '../../types/questTypes';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface QuestWithLog extends Quest {
  lastLog?: Post;
}

interface ActiveQuestBoardProps {
  /** When true, only display quests authored by the current user */
  onlyMine?: boolean;
}

const ActiveQuestBoard: React.FC<ActiveQuestBoardProps> = ({ onlyMine }) => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<QuestWithLog[]>([]);
  const [tasks, setTasks] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  const items = [
    ...quests.map(q => ({ type: 'quest' as const, quest: q })),
    ...tasks.map(t => ({ type: 'task' as const, task: t })),
  ];

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        const [boardData, recent] = await Promise.all([
          fetchActiveQuestBoard(),
          fetchRecentPosts(undefined, 1),
        ]);
        const questMap: Record<string, QuestWithLog> = {};
        boardData.quests.forEach(q => {
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
          boardData.quests.map(async q => {
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

        let enriched = Object.values(questMap);
        if (onlyMine) {
          enriched = enriched.filter(q => q.authorId === user?.id);
          setTasks(boardData.tasks.filter(t => t.authorId === user?.id));
        } else {
          setTasks(boardData.tasks);
        }
        setQuests(enriched);
      } catch (err) {
        console.warn('[ActiveQuestBoard] Failed to load quests', err);
        setQuests([]);
        setTasks([]);
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
      const next = (prev + delta + items.length) % items.length;
      scrollToIndex(next);
      indexRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (items.length > 0) {
      scrollToIndex(indexRef.current);
    }
  }, [items.length]);

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
  }, [quests, tasks]);

  const handleCreateSave = (quest: Quest) => {
    setQuests(q => [quest, ...q]);
    setShowCreate(false);
  };

  if (!user) return null;
  if (loading) return <Spinner />;

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
      {items.length === 0 ? (
        <div className="text-center text-secondary py-8">
          No posts available to view.
        </div>
      ) : (
        <>
          <div className="relative">
            <div
              ref={containerRef}
              className="flex overflow-x-auto gap-4 snap-x snap-mandatory px-2 pb-4 scroll-smooth"
            >
              {items.map((item, idx) => (
                <div
                  key={item.type === 'quest' ? item.quest.id : item.task.id}
                  className={
                    'snap-center flex-shrink-0 w-[90%] sm:w-[850px] transition-transform duration-300 ' +
                    (idx === index
                      ? 'scale-100'
                      : Math.abs(idx - index) === 1
                      ? 'scale-95 opacity-80'
                      : 'scale-90 opacity-50')
                  }
                >
                  <ErrorBoundary>
                    {item.type === 'quest' ? (
                      <QuestCard quest={item.quest} user={user as User} />
                    ) : (
                      <TaskCard task={item.task} questId={item.task.questId!} user={user as User} />
                    )}
                  </ErrorBoundary>
                </div>
              ))}
            </div>
            {items.length > 1 && (
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
              const dots = items.length > 3 ? [index - 1, index, index + 1] : items.map((_, i) => i);
              return dots.map((i, idx) => {
                const actual = ((i % items.length) + items.length) % items.length;
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
        </>
      )}
    </div>

  );
};

export default ActiveQuestBoard;
