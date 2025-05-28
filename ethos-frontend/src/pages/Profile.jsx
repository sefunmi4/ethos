import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Board from '../components/boards/Board';
import QuestCard from '../components/quests/QuestCard';
import ProfileBanner from '../components/ProfileBanner';
import { axiosWithAuth } from '../utils/authUtils';

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [userPostBoard, setUserPostBoard] = useState(null);
  const [userQuestBoard, setUserQuestBoard] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchBoards = async () => {
      try {
        const [postsRes, questsRes] = await Promise.all([
          axiosWithAuth.get('/api/boards/default/profile?enrich=true'),
          axiosWithAuth.get('/api/boards/default/quests?enrich=true'),
        ]);
        setUserPostBoard(postsRes.data);
        setUserQuestBoard(questsRes.data);
      } catch (err) {
        console.error('Error loading profile boards:', err);
      }
    };

    fetchBoards();
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
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <ProfileBanner user={user} />

      <section className="mt-10 mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📘 Your Quests</h2>
        {userQuestBoard ? (
          userQuestBoard.enrichedItems?.length > 0 ? (
            <Board
              board={userQuestBoard}
              structure="scroll"
              title="Your Quests"
              renderItem={(quest) => (
                <QuestCard quest={quest} user={user} readOnly={false} />
              )}
            />
          ) : (
            <div className="text-gray-500 text-center py-8">You haven't created any quests yet.</div>
          )
        ) : (
          <div className="text-gray-500 text-center py-8">Loading quests...</div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📝 Your Post History</h2>
        {userPostBoard ? (
          userPostBoard.enrichedItems?.length > 0 ? (
            <Board
              board={userPostBoard}
              structure="list"
              title="Your Post History"
            />
          ) : (
            <div className="text-gray-500 text-center py-8">You haven't posted anything yet.</div>
          )
        ) : (
          <div className="text-gray-500 text-center py-8">Loading posts...</div>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;