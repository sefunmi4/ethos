// Graph-based activity feed (simplified)

import React, { useCallback, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types/userTypes';
import { useBoard } from '../../hooks/useBoard';
import { useSocketListener } from '../../hooks/useSocket';
import { fetchBoard } from '../../api/board';
import { Spinner } from '../ui';
import Board from '../board/Board';

interface RecentActivityBoardProps {
  boardId?: string;
}

const RecentActivityBoard: React.FC<RecentActivityBoardProps> = ({ boardId = 'timeline-board' }) => {
  const { user } = useAuth();
  const { board, setBoard } = useBoard(boardId);

  const [{ page, loading, hasMore }, setState] = useState({
    page: 1,
    loading: false,
    hasMore: true,
  });

  const loadMore = useCallback(async () => {
    if (!boardId || loading || !hasMore) return;

    setState(s => ({ ...s, loading: true }));
    try {
      const nextPage = page + 1;
      const more = await fetchBoard(boardId, {
        page: nextPage,
        limit: DEFAULT_PAGE_SIZE,
        enrich: true,
        userId: user?.id,
      });

      if (more?.items?.length) {
        setBoard(prev =>
          prev
            ? {
                ...prev,
                items: [...(prev.items || []), ...more.items],
                enrichedItems: [
                  ...(prev.enrichedItems || []),
                  ...(more.enrichedItems || []),
                ],
              }
            : more
        );
        setState({ page: nextPage, loading: false, hasMore: true });
      } else {
        setState(s => ({ ...s, loading: false, hasMore: false }));
      }
    } catch (err) {
      console.error('[RecentActivityBoard] Pagination error:', err);
      setState(s => ({ ...s, loading: false }));
    }
  }, [boardId, page, loading, hasMore, user?.id, setBoard]);

  // Refresh the board when a websocket update is received
  useSocketListener(
    'board:update',
    payload => {
      if (payload?.id !== boardId) return;
      fetchBoard(boardId, { enrich: true, userId: user?.id })
        .then(setBoard)
        .catch(err => console.error('[RecentActivityBoard] Refresh error:', err));
    }
  );

  if (!board) return <Spinner />;

  return (
    <Board
      boardId={boardId}
      board={board}
      layout="list"
      compact
      hideControls
      headerOnly
      user={user as unknown as User}
      loading={loading}
      onScrollEnd={loadMore}
    />
  );
};

export default RecentActivityBoard;