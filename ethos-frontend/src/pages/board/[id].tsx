import React, { useEffect, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBoard } from '../../hooks/useBoard';
import { fetchBoard } from '../../api/board';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';
import { useBoardContext } from '../../contexts/BoardContext';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import Board from '../../components/board/Board';
import BoardSearchFilter from '../../components/board/BoardSearchFilter';
import { Spinner } from '../../components/ui';
import { fetchQuestById } from '../../api/quest';

import type { BoardData } from '../../types/boardTypes';
import type { Quest } from '../../types/questTypes';

const BoardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { socket } = useSocket();
  const { canEditBoard } = usePermissions();
  const { user } = useAuth();
  const { setBoardMeta } = useBoardContext();
  const { board: boardData, setBoard, isLoading, refresh: refetch } = useBoard(id);

  const [quest, setQuest] = useState<Quest | null>(null);

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const loadQuest = useCallback(async (questId: string) => {
    try {
      const q = await fetchQuestById(questId);
      setQuest(q);
    } catch (err) {
      console.warn('[BoardPage] Failed to load quest:', err);
    }
  }, []);

  // Join board socket room and refetch on update
  const handleBoardUpdate = useCallback(() => {
    refetch().then((updated) => {
      if (updated?.questId) {
        loadQuest(updated.questId);
      }
    });
  }, [refetch, loadQuest]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join', { room: `board-${id}` });
    socket.on('board:update', handleBoardUpdate);
    return () => {
      socket.emit('leave', { room: `board-${id}` });
      socket.off('board:update', handleBoardUpdate);
    };
  }, [socket, id, handleBoardUpdate]);

  useEffect(() => {
    if (boardData) {
      setBoardMeta({
        id: boardData.id,
        title: boardData.title,
        layout: boardData.layout,
      });
      if (boardData.questId) {
        loadQuest(boardData.questId);
      } else {
        setQuest(null);
      }
      const tagSet = new Set<string>();
      (boardData.enrichedItems || []).forEach((it: any) => {
        (it.tags || []).forEach((t: string) => tagSet.add(t));
      });
      setAvailableTags(Array.from(tagSet));
    }
  }, [boardData, setBoardMeta, loadQuest]);

  const loadMore = async () => {
    if (!id || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const moreData: BoardData = await fetchBoard(id, {
        page: page + 1,
        limit: DEFAULT_PAGE_SIZE,
        enrich: true,
        userId: user?.id,
      });
      if (moreData?.items?.length) {
        setBoard((prev) =>
          prev
            ? {
                ...prev,
                items: [...prev.items, ...moreData.items],
                enrichedItems: [
                  ...(prev.enrichedItems || []),
                  ...(moreData.enrichedItems || []),
                ],
              }
            : prev
        );
        setPage((p) => p + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn('[BoardPage] Pagination error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (isLoading) return <Spinner />;
  if (!boardData) return <div className="p-6 text-center text-red-500">Board not found.</div>;

  const editable = canEditBoard(boardData.id);

  return (
    <main className="max-w-7xl mx-auto p-4 space-y-8 bg-soft dark:bg-soft-dark">
      <div className="flex flex-col md:flex-row gap-6">
        <BoardSearchFilter
          tags={availableTags}
          className="md:w-64"
          onChange={(f) => setView(f.view)}
        />
        <div className="flex-1">
          <div className="bg-soft dark:bg-soft-dark rounded-xl shadow-lg p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-primary dark:text-primary">{boardData.title}</h1>
              {editable && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Edit Board
                </button>
              )}
            </div>

            <Board
              boardId={id}
              board={boardData}
              layout={view}
              quest={quest || undefined}
              editable={editable}
              showCreate={editable}
              hideControls
              onScrollEnd={loadMore}
              loading={loadingMore}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default BoardPage;