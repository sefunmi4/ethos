import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchActiveQuests } from '../../api/quest';
import { fetchRecentPosts, fetchPostById } from '../../api/post';
import QuestSummaryCard from './QuestSummaryCard';
import QuestStatusList from './QuestStatusList';
import { Spinner } from '../ui';
import { ROUTES } from '../../constants/routes';
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
  const [expanded, setExpanded] = useState<QuestWithLog | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      const offset = card.offsetLeft - el.clientWidth / 2 + card.clientWidth / 2;
      el.scrollTo({ left: offset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToIndex(index);
  }, [index]);

  if (!user) return null;
  if (loading) return <Spinner />;
  if (quests.length === 0) return null;

  const showSeeAll = quests.length > BOARD_PREVIEW_LIMIT;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={containerRef}
          className="flex overflow-x-auto gap-4 snap-x snap-mandatory px-2 pb-4 scroll-smooth"
        >
          {quests.map((q, idx) => (
            <div
              key={q.id}
              className={`snap-center flex-shrink-0 transition-all ${
                idx === index
                  ? 'w-[80%] sm:w-[640px]'
                  : 'w-64 sm:w-[300px] opacity-80'
              }`}
            >
              <div className="w-full">
                <QuestSummaryCard quest={q} />
                <div className="text-right mt-1">
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => {
                      setExpanded(q);
                      setIndex(idx);
                    }}
                  >
                    {expanded?.id === q.id ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {quests.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-surface hover:bg-background rounded-full shadow p-1"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => setIndex(i => Math.min(quests.length - 1, i + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-surface hover:bg-background rounded-full shadow p-1"
            >
              ▶
            </button>
          </>
        )}
      </div>

      {expanded && (
        <div className="border rounded-lg p-4 bg-surface">
          <QuestStatusList quest={expanded} />
        </div>
      )}

      {showSeeAll && (
        <div className="text-right">
          <Link to={ROUTES.BOARD('active')} className="text-sm text-blue-600 underline">
            → See all
          </Link>
        </div>
      )}
    </div>
  );
};

export default ActiveQuestBoard;
