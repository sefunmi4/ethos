import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBoard } from '../hooks/useBoard';
import { useSocketListener } from '../hooks/useSocket';

import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

import Banner from '../components/ui/Banner';
import Board from '../components/board/Board';
import BoardSearchFilter from '../components/board/BoardSearchFilter';
import { Spinner } from '../components/ui';
import ActiveQuestBoard from '../components/quest/ActiveQuestBoard';

import type { User } from '../types/userTypes';
import type { BoardData } from '../types/boardTypes';

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const {
    board: userQuestBoard,
    setBoard: setUserQuestBoard,
  } = useBoard('my-quests', { pageSize: 1000 });

  const {
    board: userPostBoard,
    setBoard: setUserPostBoard,
    isLoading: loadingPosts,
  } = useBoard('my-posts', { pageSize: 1000 });

  const [view, setView] = useState<'grid' | 'list'>('list');


  useSocketListener('board:update', (updatedBoard: BoardData) => {
    if (!updatedBoard || !user) return;
    if (updatedBoard.id === userQuestBoard?.id) setUserQuestBoard(updatedBoard);
    if (updatedBoard.id === userPostBoard?.id) setUserPostBoard(updatedBoard);
  });


  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user || !user.username) {
    return <div className="text-center py-12 text-red-500">You must be logged in to view your profile.</div>;
  }

  const castUser = user as unknown as User;

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl bg-soft dark:bg-soft-dark text-primary">
      
      <Banner user={castUser} />

      {/* 📘 Your Quests */}
      <section className="mb-12">
        <ActiveQuestBoard onlyMine />

        <div className="text-right">
          <Link to={ROUTES.BOARD('active')} className="text-sm text-blue-600 underline">
            → See all
          </Link>
        </div>
      </section>
      

      {/* 📝 Post History */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-4">📝 Your Post History</h2>
        {loadingPosts ? (
          <Spinner />
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <BoardSearchFilter className="md:w-64" onChange={(f) => setView(f.view)} />
            <div className="flex-1">
              <Board
                boardId="my-posts"
                board={userPostBoard}
                layout={view}
                user={castUser}
                compact
                hideControls
                headerOnly
              />
              {userPostBoard?.enrichedItems?.length === 0 && (
                <div className="text-secondary text-center py-8">
                  You haven't posted anything yet.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;