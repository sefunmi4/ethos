import React, { useCallback, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';
import { useAuth } from '../../contexts/AuthContext';
import { useBoard } from '../../hooks/useBoard';
import { fetchBoard } from '../../api/board';
import Board from '../board/Board';
import { Spinner } from '../ui';
import type { User } from '../../types/userTypes';

import type { BoardData } from '../../types/boardTypes';

interface ActivityFeedProps {
  boardId?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ boardId = 'timeline-board' }) => {
  const { user } = useAuth();
  const { board, setBoard } = useBoard(boardId);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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
      console.warn('[ActivityFeed] Pagination error:', err);
    } finally {
      setLoading(false);
    }
  }, [boardId, page, loading, hasMore, user?.id, setBoard]);

  if (!board) return <Spinner />;

  return (
    <Board
      boardId={boardId}
      board={board}
      layout="grid"
      hideControls
      user={user as User}
      onScrollEnd={loadMore}
      loading={loading}
    />
  );
};

export default ActivityFeed;
