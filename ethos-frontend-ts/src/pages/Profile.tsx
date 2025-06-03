import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBoard } from '../hooks/useBoard';
import { useSocket } from '../hooks/useSocket';

import ProfileBanner from '../components/ProfileBanner';
import Board from '../components/boards/Board';
import ContributionCard from '../components/contribution/ContributionCard';

import type { BoardData } from '../types/boardTypes';
import type { Quest } from '../types/questTypes';
import type { Post } from '../types/postTypes';

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // 🧠 Load board data via reusable hooks
  const {
    board: userQuestBoard,
    setBoard: setUserQuestBoard,
    isLoading: loadingQuests,
  } = useBoard('my-quests'); // abstract key or id for personalized fetch logic

  const {
    board: userPostBoard,
    setBoard: setUserPostBoard,
    isLoading: loadingPosts,
  } = useBoard('my-posts'); // same as above — key tells the hook what to fetch

  // 🔁 Live sync with socket events
  useSocket('boardUpdated', (updatedBoard: BoardData) => {
    if (!updatedBoard || !user) return;
    if (updatedBoard.id === userQuestBoard?.id) setUserQuestBoard(updatedBoard);
    if (updatedBoard.id === userPostBoard?.id) setUserPostBoard(updatedBoard);
  });

  // 🔐 Auth check
  if (authLoading) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Loading session...</div>;
  }

  if (!user) {
    return <div className="text-center py-12 text-red-500">You must be logged in to view your profile.</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <ProfileBanner user={user} />

      {/* 📘 Quests */}
      <section className="mt-10 mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📘 Your Quests</h2>
        {loadingQuests ? (
          <div className="text-gray-500 text-center py-8">Loading quests...</div>
        ) : userQuestBoard?.enrichedItems?.length ? (
          <Board
            board={userQuestBoard}
            structure="scroll"
            title="Your Quests"
            renderItem={(item: Quest) => (
              <ContributionCard
                item={item}
                user={user}
                type="quest"
                readOnly={false}
              />
            )}
          />
        ) : (
          <div className="text-gray-500 text-center py-8">You haven't created any quests yet.</div>
        )}
      </section>

      {/* 📝 Posts */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📝 Your Post History</h2>
        {loadingPosts ? (
          <div className="text-gray-500 text-center py-8">Loading posts...</div>
        ) : userPostBoard?.enrichedItems?.length ? (
          <Board
            board={userPostBoard}
            structure="list"
            title="Your Post History"
            renderItem={(item: Post) => (
              <ContributionCard
                item={item}
                user={user}
                type="post"
                readOnly={false}
              />
            )}
          />
        ) : (
          <div className="text-gray-500 text-center py-8">You haven't posted anything yet.</div>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;