// Graph-based activity feed based on post linkage and user involvement
//
// Logic:
// - Fetch posts where:
//   - post.authorId === user.id
//   - post.questId is in a quest the user is involved in
//   - post.linksTo[] includes any post by user
//
// Future (optional):
// - Support 2-hop or 3-hop feed expansion using graph traversal
// - Weighted scoring by freshness - hopCost
//
// Display:
// - Feed-style layout
// - Sort by most recent post timestamp (or last reply)
// - Add filters for type (log, request, reply)

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types/userTypes';
import { useBoard } from '../../hooks/useBoard';
import { useSocketListener } from '../../hooks/useSocket';
import { fetchBoard } from '../../api/board';
import { Spinner } from '../ui';
import Board from '../board/Board';

/**
 * RecentActivityBoard renders a board showing the latest activity for the
 * homepage. It loads data using the `useBoard` hook and listens for
 * `board:update` events via websockets to stay up to date.
 */
interface RecentActivityBoardProps {
  boardId?: string;
}

const RecentActivityBoard: React.FC<RecentActivityBoardProps> = ({ boardId = 'timeline-board' }) => {
  const { user } = useAuth();
  const { board, setBoard } = useBoard(boardId);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Load additional pages when the board scrolls to the end
  const loadMore = useCallback(async () => {
    if (!boardId || loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const more = await fetchBoard(boardId, {
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
      console.warn('[RecentActivityBoard] Pagination error:', err);
    } finally {
      setLoading(false);
    }
  }, [boardId, page, loading, hasMore, user?.id, setBoard]);

  // Refresh the board when a websocket update is received
  useSocketListener('board:update', payload => {
    if (!boardId || payload.id !== boardId) return;
    fetchBoard(boardId, { enrich: true, userId: user?.id }).then(setBoard);
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      if (el.scrollHeight - el.scrollTop <= el.clientHeight + 150) {
        loadMore();
      }
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [loadMore]);

  if (!board) return <Spinner />;

  return (
    <Board
      boardId={boardId}
      board={board}
      layout="list"
      compact
      hideControls
      onScrollEnd={loadMore}
      loading={loading}
      user={user as unknown as User}
      headerOnly
    />
  );
};

export default RecentActivityBoard;
