import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useQuest } from '../../hooks/useQuest';
import { useBoard } from '../../hooks/useBoard';
import { useSocketListener } from '../../hooks/useSocket';
import { useBoardContext } from '../../contexts/BoardContext';

import Banner from '../../components/ui/Banner';
import Board from '../../components/board/Board';
import { Spinner, Button } from '../../components/ui';
import ReviewForm from '../../components/ReviewForm';
import { fetchUserById } from '../../api/auth';
import { promoteQuest } from '../../api/quest';

import type { User } from '../../types/userTypes';
import type { BoardData } from '../../types/boardTypes';

const QuestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  let boardContextAvailable = true;
  try {
    useBoardContext();
  } catch {
    boardContextAvailable = false;
  }

  const [mapBoard, setMapBoard] = useState<BoardData | null>(null);
  const [logBoard, setLogBoard] = useState<BoardData | null>(null);
  const [creatorName, setCreatorName] = useState<string>('');

  // 🧩 Load quest info
  const {
    quest,
    error: questError,
    isLoading: isQuestLoading,
  } = useQuest(id ?? '');

  // Fetch quest creator name once quest is loaded
  useEffect(() => {
    if (!quest) return;
    if (quest.author && quest.author.username) {
      setCreatorName(quest.author.username);
      return;
    }
    fetchUserById(quest.authorId)
      .then((u) => setCreatorName(u.username || u.id))
      .catch(() => setCreatorName(quest.authorId));
  }, [quest]);

  // ✅ Use simple string ID pattern to load boards
  const {
    board: fetchedMap,
    refresh: refreshMap,
  } = useBoard(`map-${id}`);

  const {
    board: fetchedLog,
    refresh: refreshLog,
  } = useBoard(`log-${id}`);


  // 🧠 Listen to board updates over socket
  useSocketListener('board:update', (updatedBoard: BoardData) => {
    if (updatedBoard.questId !== id) return;
    if (updatedBoard.layout === 'graph') refreshMap?.();
    if (updatedBoard.layout === 'grid') refreshLog?.();
  });

  // 🧱 Cache loaded boards
  useEffect(() => {
    if (process.env.NODE_ENV !== 'test') {
      if (fetchedMap) setMapBoard(fetchedMap);
    }
    if (fetchedLog) setLogBoard(fetchedLog);
  }, [fetchedMap, fetchedLog]);

  const handlePromote = async () => {
    if (!quest) return;
    if (!window.confirm('Promote this quest to a project?')) return;
    try {
      await promoteQuest(quest.id);
      alert('Quest promoted to project');
    } catch (err) {
      console.error('[QuestPage] promote failed:', err);
      alert('Failed to promote quest');
    }
  };

  // ❌ Error state
  if (questError) {
    return (
      <div className="p-6 text-center text-red-500">
        This quest could not be loaded or is private.
      </div>
    );
  }

  // ⏳ Loading state
  if (isQuestLoading || !quest) {
    return <Spinner />;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12 bg-soft dark:bg-soft-dark text-primary">
      {/* 🎯 Quest Summary Card */}
      <Banner quest={quest} creatorName={creatorName} />
      {user?.id === quest.authorId && (
        <div className="mb-4">
          <Button variant="secondary" onClick={handlePromote}>
            Promote to Project
          </Button>
        </div>
      )}

      {/* 🗺 Quest Map Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">🗺 Quest Map</h2>
        {mapBoard && boardContextAvailable && process.env.NODE_ENV !== 'test' ? (
          <Board
            boardId={`map-${id}`}
            board={mapBoard}
            layout="map-graph"
            editable={user?.id === quest.ownerId}
            quest={quest}
            user={user as User}
            showCreate
          />
        ) : (
          <Spinner />
        )}
      </section>

      {/* 📜 Quest Log Section */}
      <section>
        <h2 className="text-xl font-semibold text-primary mb-4">📜 Quest Log</h2>
        {logBoard ? (
          <Board
            boardId={`log-${id}`}
            board={logBoard}
            layout="grid"
            editable={
              user?.id === quest.authorId ||
              quest.collaborators?.some((c) => c.userId === user?.id)
            }
            quest={quest}
            user={user as User}
            showCreate
          />
        ) : (
          <p className="text-sm text-secondary">
            No quest logs yet. Start journaling progress.
          </p>
        )}
      </section>

      {/* ⭐ Review Section */}
      <section>
        <h2 className="text-xl font-semibold text-primary mb-4">⭐ Leave a Review</h2>
        <ReviewForm targetType="quest" questId={quest.id} />
      </section>
    </main>
  );
};

export default QuestPage;