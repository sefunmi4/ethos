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
    </main>
  );
};

export default HomePage;
