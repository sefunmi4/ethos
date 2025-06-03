import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useQuest } from '../../hooks/useQuest';
import { useBoard } from '../../hooks/useBoard';
import { useSocket } from '../../hooks/useSocket';

import QuestBanner from '../../components/quest/QuestBanner';
import Board from '../../components/board/Board';

import type { BoardData } from '../../types/boardTypes';

const QuestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [mapBoard, setMapBoard] = useState<BoardData | null>(null);
  const [logBoard, setLogBoard] = useState<BoardData | null>(null);

  const {
    quest,
    error: questError,
    isLoading: isQuestLoading,
  } = useQuest(id);

  const {
    board: fetchedMap,
    refresh: refreshMap,
  } = useBoard({ questId: id, type: 'map', enrich: true });

  const {
    board: fetchedLog,
    refresh: refreshLog,
  } = useBoard({ questId: id, type: 'log', enrich: true });

  useEffect(() => {
    if (fetchedMap) setMapBoard(fetchedMap);
    if (fetchedLog) setLogBoard(fetchedLog);
  }, [fetchedMap, fetchedLog]);

  useSocket('boardUpdated', (updatedBoard: BoardData) => {
    if (updatedBoard.questId !== id) return;
    if (updatedBoard.type === 'map') refreshMap();
    if (updatedBoard.type === 'log') refreshLog();
  });

  if (questError) {
    return <div className="p-6 text-center text-red-500">This quest could not be loaded or is private.</div>;
  }

  if (isQuestLoading || !quest) {
    return <div className="p-6 text-center text-gray-500">Loading quest...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* 🧭 Quest Overview */}
      <QuestBanner quest={quest} />
      <Board
        board={{
          id: `quest-${quest.id}`,
          title: 'Quest Overview',
          structure: 'list',
          items: [quest],
          enrichedItems: [quest],
        }}
        editable={false}
        compact={false}
      />

      {/* 🗺 Quest Map */}
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

      {/* 📜 Quest Log */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📜 Quest Log</h2>
        {logBoard ? (
          <Board
            board={logBoard}
            structure="list"
            editable={true}
            quest={quest}
            user={user}
            showCreate
          />
        ) : (
          <p className="text-sm text-gray-500">No quest logs yet. Start journaling progress.</p>
        )}
      </section>
    </main>
  );
};

export default QuestPage;