import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useQuest } from '../../hooks/useQuest';
import { useBoard } from '../../hooks/useBoard';
import { useSocket } from '../../hooks/useSocket';

import QuestBanner from '../../components/quest/QuestBanner';
import QuestCard from '../../components/quest/QuestCard';
import CreateContribution from '../../components/contribution/CreateContribution';
import PostCard from '../../components/post/PostCard';
import Board from '../../components/board/Board';

import type { Post } from '../../types/postTypes';
import type { AuthUser } from '../../types/authTypes';
import type { BoardData } from '../../types/boardTypes';

const QuestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [showCreate, setShowCreate] = useState(false);
  const [logBoard, setLogBoard] = useState<BoardData | null>(null);
  const [mapBoard, setMapBoard] = useState<BoardData | null>(null);

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

  const handleNewLog = (newPost: Post) => {
    setLogBoard(prev =>
      prev ? { ...prev, enrichedItems: [newPost, ...prev.enrichedItems] } : null
    );
    setShowCreate(false);
  };

  if (questError) {
    return <div className="p-6 text-center text-red-500">This quest could not be loaded or is private.</div>;
  }

  if (isQuestLoading || !quest) {
    return <div className="p-6 text-center text-gray-500">Loading quest...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      <QuestBanner quest={quest} />
      <QuestCard quest={quest} user={user as AuthUser} readOnly />

      {/* 🗺 Quest Map Board */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🗺 Quest Map</h2>
        {mapBoard ? (
          <Board
            board={mapBoard}
            structure="graph"
            editable={user?.id === quest.ownerId}
            renderItem={(post: Post) => (
              <PostCard key={post.id} post={post} user={user as AuthUser} />
            )}
          />
        ) : (
          <p className="text-sm text-gray-500">No quest map defined yet.</p>
        )}
      </section>

      {/* 📜 Quest Log Board */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">📜 Quest Log</h2>
          {user && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showCreate ? 'Cancel' : '+ Add Log Entry'}
            </button>
          )}
        </div>

        {showCreate && (
          <div className="border rounded p-4 bg-white shadow mb-4">
            <CreateContribution
              typeOverride="post"
              quests={[quest]}
              onSave={handleNewLog}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {logBoard ? (
          <Board
            board={logBoard}
            structure="timeline"
            renderItem={(post: Post) => (
              <PostCard key={post.id} post={post} user={user as AuthUser} compact />
            )}
          />
        ) : (
          <p className="text-sm text-gray-500">No quest logs yet. Start journaling progress.</p>
        )}
      </section>
    </main>
  );
};

export default QuestPage;