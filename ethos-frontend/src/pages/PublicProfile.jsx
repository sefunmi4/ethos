import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BoardProvider } from '../contexts/BoardContext';
import ProfileBanner from '../components/ProfileBanner';
import Board from '../components/boards/Board';
import BoardToolbar from '../components/boards/BoardToolbar';
import QuestCard from '../components/quests/QuestCard';
import axios from 'axios';

const PublicProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [questBoard, setQuestBoard] = useState(null);
  const [postBoard, setPostBoard] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await axios.get(`/api/users/${userId}/profile`);
        setProfile(profileRes.data);

        const [questsRes, postsRes] = await Promise.all([
          axios.get(`/api/boards/user/${userId}/quests`),
          axios.get(`/api/boards/user/${userId}/posts`)
        ]);

        setQuestBoard(questsRes.data);
        setPostBoard(postsRes.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Profile not found or inaccessible.');
      }
    };

    fetchProfile();
  }, [userId]);

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div className="p-4 text-center text-gray-500">Loading profile...</div>;
  }

  return (
    <BoardProvider initialStructure="list">
      <main className="max-w-6xl mx-auto px-4 py-10">
        <ProfileBanner user={profile} readOnly />

        <section className="mt-10 mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📘 Public Quests</h2>
          {questBoard ? (
            <>
              <BoardToolbar title={questBoard.title} filters={questBoard.filters} />
              <Board
                board={questBoard}
                structure="scroll"
                renderItem={(quest) => (
                  <QuestCard quest={quest} user={profile} readOnly />
                )}
              />
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">No public quests available.</div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🧭 Public Posts</h2>
          {postBoard ? (
            <>
              <BoardToolbar title={postBoard.title} filters={postBoard.filters} />
              <Board board={postBoard} />
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">No public posts found.</div>
          )}
        </section>
      </main>
    </BoardProvider>
  );
};

export default PublicProfilePage;