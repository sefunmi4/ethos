// src/pages/NotFound.tsx

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useBoardContext } from '../contexts/BoardContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTimeline } from '../hooks/useTimeline';
import { useSocket } from '../hooks/useSocket';

import ListLayout from '../components/layout/ListLayout';
import ContributionCard from '../components/contribution/ContributionCard';
import Button from '../components/ui/Button';

import type { Quest } from '../types/questTypes';
import type { Post } from '../types/postTypes';

const NotFound: React.FC = () => {
  const { user } = useAuth();
  const { userQuestBoard, userPostBoard } = useBoardContext();
  const { can } = usePermissions();
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

  const showQuests = user && userQuestBoard?.enrichedItems?.length;
  const showPosts = user && userPostBoard?.enrichedItems?.length;

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

      {/* 🧭 Suggest Quests */}
      {showQuests && (
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Recent Quests</h3>
          <ListLayout
            items={userQuestBoard.enrichedItems.slice(0, 3)}
            renderItem={(quest: Quest) => (
              <ContributionCard item={quest} type="quest" user={user} readOnly />
            )}
          />
        </div>
      )}

      {/* ✍️ Suggest Posts */}
      {showPosts && (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Recent Posts</h3>
          <ListLayout
            items={userPostBoard.enrichedItems.slice(0, 3)}
            renderItem={(post: Post) => (
              <ContributionCard item={post} type="post" user={user} readOnly />
            )}
          />
        </div>
      )}
    </main>
  );
};

export default NotFound;