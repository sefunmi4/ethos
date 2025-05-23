import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BoardProvider } from '../contexts/BoardContext';
import Board from '../components/boards/Board';
import BoardToolbar from '../components/boards/BoardToolbar';
import QuestCard from '../components/quests/QuestCard';
import ProfileBanner from '../components/ProfileBanner';
import axios from 'axios';

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [userPostBoard, setUserPostBoard] = useState(null);
  const [userQuestBoard, setUserQuestBoard] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        const [postBoardRes, questBoardRes] = await Promise.all([
          axios.get('/api/boards/default/profile'),
          axios.get('/api/boards/default/quests')
        ]);
        setUserPostBoard(postBoardRes.data);
        setUserQuestBoard(questBoardRes.data);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-red-500">
        You must be logged in to view your profile.
      </div>
    );
  }

  return (
    <BoardProvider initialStructure="list">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <ProfileBanner user={user} />

        <section className="mt-10 mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📘 Your Quests</h2>
          {userQuestBoard ? (
            <>
              <BoardToolbar title={""} filters={userQuestBoard.filters} />
              <Board
                board={userQuestBoard}
                structure="scroll"
                renderItem={(quest) => (
                  <QuestCard quest={quest} user={user} readOnly={false} />
                )}
              />
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">Loading quests...</div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📝 Your Post History</h2>
          {userPostBoard ? (
            <>
              <BoardToolbar title={""} filters={userPostBoard.filters} />
              <Board board={userPostBoard} />
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">Loading posts...</div>
          )}
        </section>
      </main>
    </BoardProvider>
  );
};

export default ProfilePage;