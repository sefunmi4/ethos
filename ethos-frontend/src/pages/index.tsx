import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Board from '../components/board/Board';
import PostTypeFilter from '../components/board/PostTypeFilter';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { Spinner } from '../components/ui';

import type { User } from '../types/userTypes';

const HomePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [postType, setPostType] = useState('');

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl space-y-12 bg-soft dark:bg-soft-dark">
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
          gridLayout="horizontal"
          user={user as User}
          hideControls
        />
        <div className="text-right mt-1">
          <Link to={ROUTES.BOARD('featured-quest')} className="text-blue-600 underline text-sm">
            View Board Details
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <PostTypeFilter value={postType} onChange={setPostType} />
        <Board
          boardId="request-board"
          title="🙋 Requests"
          layout="grid"
          user={user as User}
          hideControls
          filter={postType ? { postType } : {}}
        />
        <div className="text-right">
          <Link to={ROUTES.BOARD('request-board')} className="text-blue-600 underline text-sm">
            View Board Details
          </Link>
        </div>
      </section>

      <section>
        <Board
          boardId="timeline-board"
          title="⏳ Recent Activity"
          layout="grid"
          user={user as User}
          hideControls
        />
      </section>

    </main>
  );
};

export default HomePage;
