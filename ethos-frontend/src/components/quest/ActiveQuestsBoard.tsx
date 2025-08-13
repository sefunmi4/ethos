import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAllQuests } from '../../api/quest';
import { fetchPostsByQuestId, fetchRepliesByPostId } from '../../api/post';
import Board from '../board/Board';
import { Spinner } from '../ui';
import { ROUTES } from '../../constants/routes';
import { BOARD_PREVIEW_LIMIT } from '../../constants/pagination';
import type { Post } from '../../types/postTypes';
import type { BoardData } from '../../types/boardTypes';

const ActiveQuestsBoard: React.FC = () => {
  const { user } = useAuth();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        const all = await fetchAllQuests();
        const active = all.filter(q => q.status === 'active');
        const postsMap = new Map<string, Post>();

        for (const quest of active) {
          const questPosts = await fetchPostsByQuestId(quest.id);
          const involved =
            quest.authorId === user.id ||
            quest.collaborators?.some(c => c.userId === user.id) ||
            questPosts.some(p => p.authorId === user.id);
          if (!involved) continue;

          questPosts.forEach(p => {
            if ((p.type === 'free_speech' && p.replyTo) || p.type === 'file' || p.tags?.includes('review') || p.authorId === user.id) {
              postsMap.set(p.id, p);
            }
          });

          for (const link of quest.linkedPosts || []) {
            if (link.itemType === 'post') {
              const replies = await fetchRepliesByPostId(link.itemId);
              replies.forEach(r => postsMap.set(r.id, r));
            }
          }
        }

        const posts = Array.from(postsMap.values()).sort((a, b) => {
          const aDate = a.createdAt || a.timestamp;
          const bDate = b.createdAt || b.timestamp;
          return bDate.localeCompare(aDate);
        });

        if (posts.length) {
          setBoard({
            id: 'active',
            title: '🧭 Active Quests',
            boardType: 'post',
            layout: 'grid',
            items: posts.map(p => p.id),
            enrichedItems: posts,
            createdAt: new Date().toISOString(),
          });
        } else {
          setBoard(null);
        }
      } catch (err) {
        console.warn('[ActiveQuestsBoard] Failed to load quests', err);
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

  const showSeeAll = (board.enrichedItems?.length || 0) > BOARD_PREVIEW_LIMIT;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">🧭 Active Quests</h2>
        {showSeeAll && (
          <Link to={ROUTES.BOARD('active')} className="text-sm text-blue-600 underline">
            → See all
          </Link>
        )}
      </div>
      <Board board={board} layout="grid" hideControls compact />
    </div>
  );
};

export default ActiveQuestsBoard;
