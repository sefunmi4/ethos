// src/pages/NotFound.tsx

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useBoardContextEnhanced } from '../contexts/BoardContext';
//import { usePermissions } from '../hooks/usePermissions';
import { useTimeline } from '../hooks/useTimeline';
import { useSocket } from '../hooks/useSocket';

import Board from '../components/board/Board';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  const { user } = useAuth();
  const { userQuestBoard, userPostBoard } = useBoardContextEnhanced();
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
    <main className="min-h-screen bg-soft dark:bg-soft-dark px-4 py-12 text-primary">
      <section className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-6xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-secondary mb-2">
          You’ve wandered into the void 🌌
        </h2>
        <p className="text-secondary mb-6">
          The page you’re looking for doesn’t exist. No quests here, only echoes...
        </p>
        <Link to="/">
          <Button variant="primary">Return to Homepage</Button>
        </Link>
      </section>

      {/* 🧭 Suggested Quest Board */}
      {hasQuests && (
        <section className="mb-16">
          <h3 className="text-xl font-semibold text-primary mb-4 text-center">
            Recent Quests
          </h3>
          <Board
            board={userQuestBoard}
            layout={userQuestBoard.layout || 'grid'}
            editable={false}
            compact={true}
            title="Suggested Quests"
          />
        </section>
      )}

      {/* ✍️ Suggested Post Board */}
      {hasPosts && (
        <section>
          <h3 className="text-xl font-semibold text-primary mb-4 text-center">
            Recent Posts
          </h3>
          <Board
            board={userPostBoard}
            layout={userPostBoard.layout || 'grid'}
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