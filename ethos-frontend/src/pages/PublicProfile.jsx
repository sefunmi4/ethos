import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import ProfileBanner from '../components/ProfileBanner';
import Board from '../components/boards/Board';
import QuestCard from '../components/quests/QuestCard';
import PostCard from '../components/posts/PostCard';

import { axiosWithAuth } from '../utils/authUtils';

const PublicProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [questBoard, setQuestBoard] = useState(null);
  const [postBoard, setPostBoard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, questsRes, postsRes] = await Promise.all([
          axiosWithAuth.get(`/api/users/${userId}/profile`),
          axiosWithAuth.get(`/api/boards/user/${userId}/quests?enrich=true`),
          axiosWithAuth.get(`/api/boards/user/${userId}/posts?enrich=true`)
        ]);

        setProfile(profileRes.data);
        setQuestBoard(questsRes.data);
        setPostBoard(postsRes.data);
      } catch (err) {
        console.error('Failed to load public profile:', err);
        setError('User not found or profile is private.');
      }
    };

    fetchData();
  }, [userId]);

  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;
  if (!profile) return <div className="text-center text-gray-500 py-8">Loading profile...</div>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <ProfileBanner user={profile} readOnly />

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">📘 Public Quests</h2>
        {questBoard ? (
          questBoard.enrichedItems?.length > 0 ? (
            <Board
              board={questBoard}
              structure="map"
              renderItem={(item) => (
                <QuestCard quest={item} user={profile} readOnly />
              )}
            />
          ) : (
            <div className="text-gray-500 text-center py-8">No public quests available.</div>
          )
        ) : (
          <div className="text-gray-500 text-center py-8">Loading quests...</div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">🧭 Public Posts</h2>
        {postBoard ? (
          postBoard.enrichedItems?.length > 0 ? (
            <Board
              board={postBoard}
              structure="list"
              renderItem={(item) => (
                <PostCard post={item} user={profile} readOnly />
              )}
            />
          ) : (
            <div className="text-gray-500 text-center py-8">No public posts found.</div>
          )
        ) : (
          <div className="text-gray-500 text-center py-8">Loading posts...</div>
        )}
      </section>
    </main>
  );
};

export default PublicProfilePage;