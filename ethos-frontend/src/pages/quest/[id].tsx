import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useQuest } from '../../hooks/useQuest';
import { useBoard } from '../../hooks/useBoard';
import { addBoard } from '../../api/board';
import { useBoardContext } from '../../contexts/BoardContext';
import { useSocketListener } from '../../hooks/useSocket';

import Banner from '../../components/ui/Banner';
import Board from '../../components/board/Board';
import { Button, Spinner } from '../../components/ui';
import { createMockBoard } from '../../utils/boardUtils';

import type { User } from '../../types/userTypes';
import type { BoardData } from '../../types/boardTypes';

const QuestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { refreshBoards } = useBoardContext();

  const [mapBoard, setMapBoard] = useState<BoardData | null>(null);
  const [logBoard, setLogBoard] = useState<BoardData | null>(null);

  // 🧩 Load quest info
  const {
    quest,
    error: questError,
    isLoading: isQuestLoading,
  } = useQuest(id ?? '');

  // ✅ Use simple string ID pattern to load boards
  const {
    board: fetchedMap,
    refresh: refreshMap,
    isLoading: isMapLoading,
  } = useBoard(`map-${id}`);

  const {
    board: fetchedLog,
    refresh: refreshLog,
  } = useBoard(`log-${id}`);

  const handleCreateMapBoard = async () => {
    if (!quest) return;
    try {
      const newBoard = await addBoard({
        id: `map-${quest.id}`,
        title: `${quest.title} Map`,
        layout: 'graph',
        items: [],
        questId: quest.id,
      });
      setMapBoard(newBoard);
      await refreshBoards();
    } catch (err) {
      console.error('[QuestPage] Failed to create map board:', err);
    }
  };

  // 🧠 Listen to board updates over socket
  useSocketListener('board:update', (updatedBoard: BoardData) => {
    if (updatedBoard.questId !== id) return;
    if (updatedBoard.layout === 'graph') refreshMap?.();
    if (updatedBoard.layout === 'grid') refreshLog?.();
  });

  // 🧱 Cache loaded boards
  useEffect(() => {
    if (fetchedMap) setMapBoard(fetchedMap);
    if (fetchedLog) setLogBoard(fetchedLog);
  }, [fetchedMap, fetchedLog]);

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
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* 🎯 Quest Summary Card */}
      <Banner quest={quest} />
      <Board
        board={createMockBoard(`quest-${quest.id}`, 'Quest Overview', [quest])}
        editable={false}
        compact={false}
      />

      {/* 🗺 Quest Map Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🗺 Quest Map</h2>
        {mapBoard ? (
          <Board
            boardId={`map-${id}`}
            board={mapBoard}
            layout="graph"
            editable={user?.id === quest.ownerId}
            quest={quest}
            user={user as User}
            showCreate
          />
        ) : (
          <div className="text-sm text-gray-500">
            <p className="mb-2">No quest map defined yet.</p>
            {user?.id === quest.ownerId && !isMapLoading && (
              <Button variant="primary" onClick={handleCreateMapBoard}>
                Create Map Board
              </Button>
            )}
          </div>
        )}
      </section>

      {/* 📜 Quest Log Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📜 Quest Log</h2>
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
          <p className="text-sm text-gray-500">
            No quest logs yet. Start journaling progress.
          </p>
        )}
      </section>
    </main>
  );
};

export default QuestPage;