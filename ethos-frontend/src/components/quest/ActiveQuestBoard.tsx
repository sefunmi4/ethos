import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchActiveQuests } from '../../api/quest';
import { fetchRecentPosts, fetchPostById } from '../../api/post';
import Board from '../board/Board';
import { Spinner } from '../ui';
import { ROUTES } from '../../constants/routes';
import type { Quest } from '../../types/questTypes';
import type { Post } from '../../types/postTypes';
import type { BoardData } from '../../types/boardTypes';

interface QuestWithLog extends Quest {
  lastLog?: Post;
}

const ActiveQuestBoard: React.FC = () => {
  const { user } = useAuth();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(false);

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
        if (enriched.length) {
          setBoard({
            id: 'active-quests',
            title: '🧭 Active Quests',
            boardType: 'quest',
            layout: 'grid',
            items: enriched.map(q => q.id),
            enrichedItems: enriched,
            createdAt: new Date().toISOString(),
          });
        } else {
          setBoard(null);
        }
      } catch (err) {
        console.warn('[ActiveQuestBoard] Failed to load quests', err);
        setBoard(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  if (!user) return null;
  if (loading) return <Spinner />;
  if (!board) return null;

  return (
    <div className="space-y-2">
      <Board board={board} layout="grid" hideControls compact />
      <div className="text-right">
        <Link to={ROUTES.BOARD('active')} className="text-sm text-blue-600 underline">
          → See all
        </Link>
      </div>
      <Board board={board} layout="horizontal" hideControls />
    </div>
  );
};

export default ActiveQuestBoard;
