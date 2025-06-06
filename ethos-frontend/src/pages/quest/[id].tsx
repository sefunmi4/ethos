import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useQuest } from '../../hooks/useQuest';
import { useBoard } from '../../hooks/useBoard';
import { useSocketListener } from '../../hooks/useSocket';

import Banner from '../../components/ui/Banner';
import Board from '../../components/board/Board';
import { createMockBoard } from '../../utils/boardUtils';

import type { User } from '../../types/userTypes';
import type { BoardData } from '../../types/boardTypes';

const QuestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

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
  } = useBoard(`map-${id}`);

  const {
    board: fetchedLog,
    refresh: refreshLog,
  } = useBoard(`log-${id}`);

  // 🧠 Listen to board updates over socket
  useSocketListener('board:update', (updatedBoard: BoardData) => {
    if (updatedBoard.questId !== id) return;
    if (updatedBoard.structure === 'graph') refreshMap?.();
    if (updatedBoard.structure === 'grid') refreshLog?.();
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
    return (
      <div className="p-6 text-center text-gray-500">
        Loading quest...
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* 🎯 Quest Summary Card */}
      <Banner quest={quest} />
      <Board
        board={createMockBoard(`quest-${quest.id}`, 'Quest Overview', [quest.id])}
        editable={false}
        compact={false}
      />

      {/* 🗺 Quest Map Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🗺 Quest Map</h2>
        {mapBoard ? (
          <Board
            board={mapBoard}
            structure="graph"
            editable={user?.id === quest.ownerId}
            quest={quest}
          />
        ) : (
          <p className="text-sm text-gray-500">No quest map defined yet.</p>
        )}
      </section>

      {/* 📜 Quest Log Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📜 Quest Log</h2>
        {logBoard ? (
          <Board
            board={logBoard}
            structure="grid"
            editable={true}
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