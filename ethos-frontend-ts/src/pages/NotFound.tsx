// src/pages/NotFound.tsx

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useBoardContext } from '../contexts/BoardContext';
//import { usePermissions } from '../hooks/usePermissions';
import { useTimeline } from '../hooks/useTimeline';
import { useSocket } from '../hooks/useSocket';

import Board from '../components/boards/Board';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  const { user } = useAuth();
  const { userQuestBoard, userPostBoard } = useBoardContext();
  const { addTimelineEvent } = useTimeline();
  const { socket } = useSocket();

  useEffect(() => {
    socket?.emit('navigation:404', { userId: user?.id || null });
    addTimelineEvent({
      userId: user?.id || 'guest',
      type: 'system',
      content: '🧭 Visited a 404 page',
    });
  }, [user, socket, addTimelineEvent]);

  const hasQuests = user && userQuestBoard?.enrichedItems?.length;
  const hasPosts = user && userPostBoard?.enrichedItems?.length;

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <section className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-6xl font-extrabold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          You’ve wandered into the void 🌌
        </h2>
        <p className="text-gray-500 mb-6">
          The page you’re looking for doesn’t exist. No quests here, only echoes...
        </p>
        <Link to="/">
          <Button variant="primary">Return to Homepage</Button>
        </Link>
      </section>

      {/* 🧭 Suggested Quest Board */}
      {hasQuests && (
        <section className="mb-16">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Recent Quests
          </h3>
          <Board
            board={userQuestBoard}
            structure={userQuestBoard.structure || 'list'}
            editable={false}
            compact={true}
            title="Suggested Quests"
          />
        </section>
      )}

      {/* ✍️ Suggested Post Board */}
      {hasPosts && (
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Recent Posts
          </h3>
          <Board
            board={userPostBoard}
            structure={userPostBoard.structure || 'list'}
            editable={false}
            compact={true}
            title="Suggested Posts"
          />
        </section>
      )}
    </main>
  );
};

export default NotFound;