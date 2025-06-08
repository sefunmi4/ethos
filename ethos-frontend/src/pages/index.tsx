import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Board from '../components/board/Board';

import type { User } from '../types/userTypes';

const HomePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading session...
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl space-y-12">
      <header className="mb-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
          Welcome to Ethos
        </h1>
        <p className="text-lg text-gray-600">
          A place to explore ideas, share quests, and collaborate.
        </p>
      </header>

      <section>
        <Board
          boardId="featured-quest"
          title="✨ Featured Quest"
          layout="grid"
          user={user as User}
          hideControls
        />
      </section>

      <section>
        <Board
          boardId="request-board"
          title="🙋 Requests"
          layout="grid"
          user={user as User}
          hideControls
        />
      </section>

      <section>
        <Board
          boardId="timeline-board"
          title="⏳ Recent Activity"
          layout="thread"
          user={user as User}
          hideControls
        />
      </section>

      {/* Featured Quest */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">🌟 Featured Quest</h2>
        {defaultFeedBoardId && (
          <Board
            boardId={defaultFeedBoardId}
            layout="grid"
            title="🌟 Featured Quest"
            filter={{ itemType: 'quest' }}
            hideControls
          />
        )}
      </section>

      {/* Request Posts */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📨 Requests</h2>
        {defaultFeedBoardId && (
          <Board
            boardId={defaultFeedBoardId}
            layout="grid"
            title="📨 Requests"
            filter={{ postType: 'request' }}
            user={user as User}
            hideControls
          />
        )}
      </section>

      {/* Timeline Board */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">🧵 Timeline</h2>
        {defaultFeedBoardId && (
          <Board
            boardId={defaultFeedBoardId}
            layout="thread"
            title="🧵 Recent Activity"
            user={user as User}
            hideControls
          />
        )}
      </section>
    </main>
  );
};

export default HomePage;
