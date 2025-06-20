import React, { useCallback, useState, Suspense, lazy } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';
import { useAuth } from '../../contexts/AuthContext';
import { useBoard } from '../../hooks/useBoard';
import { useSocketListener } from '../../hooks/useSocket';
import { fetchBoard } from '../../api/board';
import { Spinner } from '../ui';

import type { BoardData } from '../../types/boardTypes';
import type { Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';

const QuestCard = lazy(() => import('../quest/QuestCard'));
const PostCard = lazy(() => import('../post/PostCard'));

interface TimelineFeedProps {
  boardId?: string;
}

const TimelineFeed: React.FC<TimelineFeedProps> = ({ boardId = 'timeline-board' }) => {
  const { user } = useAuth();
  const { board, setBoard } = useBoard(boardId);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useSocketListener('board:update', payload => {
    if (!boardId || payload.boardId !== boardId) return;
    fetchBoard(boardId, { enrich: true, userId: user?.id }).then(setBoard);
  });

  const loadMore = useCallback(async () => {
    if (!boardId || loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const more: BoardData = await fetchBoard(boardId, {
        page: nextPage,
        limit: DEFAULT_PAGE_SIZE,
        enrich: true,
        userId: user?.id,
      });
      if (more.items?.length) {
        setBoard(prev =>
          prev
            ? {
                ...prev,
                items: [...prev.items, ...more.items],
                enrichedItems: [
                  ...(prev.enrichedItems || []),
                  ...(more.enrichedItems || []),
                ],
              }
            : more
        );
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn('[TimelineFeed] Pagination error:', err);
    } finally {
      setLoading(false);
    }
  }, [boardId, page, loading, hasMore, user?.id, setBoard]);

  if (!board) return <Spinner />;

  const items = board.enrichedItems || [];

  if (items.length === 0) {
    return (
      <div className="text-center text-secondary py-12 text-sm">No activity yet.</div>
    );
  }

  const handleScroll: React.UIEventHandler<HTMLDivElement> = e => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      loadMore();
    }
  };

  return (
    <div
      onScroll={handleScroll}
      className="grid gap-4 overflow-auto max-h-[80vh] snap-y snap-mandatory p-2"
    >
      <Suspense fallback={<Spinner />}>
        {items.map(item =>
          'type' in item ? (
            <div key={item.id} className="snap-start">
              <PostCard post={item as Post} user={user} />
            </div>
          ) : (
            <div key={item.id} className="snap-start">
              <QuestCard quest={item as Quest} user={user} compact />
            </div>
          )
        )}
      </Suspense>
      {loading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}
    </div>
  );
};

export default TimelineFeed;
