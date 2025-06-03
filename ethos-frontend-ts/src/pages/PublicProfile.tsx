import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useSocket } from '../hooks/useSocket';
import { useBoard } from '../hooks/useBoard';
import { useQuest } from '../hooks/useQuest';
import { usePost } from '../hooks/usePost';

import ProfileBanner from '../components/ProfileBanner';
import Board from '../components/boards/Board';

import type { BoardData } from '../types/boardTypes';
import type { User } from '../types/userTypes';

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  const [profile, setProfile] = useState<User | null>(null);
  const [questBoard, setQuestBoard] = useState<BoardData | null>(null);
  const [postBoard, setPostBoard] = useState<BoardData | null>(null);
  const [error, setError] = useState('');

  const { loadPublicBoards } = useBoard();
  const { enrichQuests } = useQuest();
  const { enrichPosts } = usePost();

  // 🧠 Load profile and related boards
  useEffect(() => {
    if (!userId) return;

    const fetchProfileData = async () => {
      try {
        const { profile, quests, posts } = await loadPublicBoards(userId);
        const enrichedQuests = await enrichQuests(quests.items);
        const enrichedPosts = await enrichPosts(posts.items);

        setProfile(profile);
        setQuestBoard({ ...quests, enrichedItems: enrichedQuests });
        setPostBoard({ ...posts, enrichedItems: enrichedPosts });
      } catch (err) {
        console.error('[PublicProfilePage] Failed to load:', err);
        setError('User not found or profile is private.');
      }
    };

    fetchProfileData();
  }, [userId]);

  // 🔁 Real-time board updates
  useSocket('boardUpdated', (updatedBoard: BoardData) => {
    if (!userId || updatedBoard.userId !== userId) return;

    if (updatedBoard.id === questBoard?.id) {
      enrichQuests(updatedBoard.items).then((items) =>
        setQuestBoard({ ...updatedBoard, enrichedItems: items })
      );
    }

    if (updatedBoard.id === postBoard?.id) {
      enrichPosts(updatedBoard.items).then((items) =>
        setPostBoard({ ...updatedBoard, enrichedItems: items })
      );
    }
  });

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center text-gray-500 py-8">Loading profile...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <ProfileBanner user={profile} readOnly />

      {/* 📘 Public Quests */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">📘 Public Quests</h2>
        {questBoard ? (
          questBoard.enrichedItems?.length ? (
            <Board
              board={questBoard}
              structure="map" // for quest overview in graph/tree format
              user={profile}
              readOnly
            />
          ) : (
            <div className="text-gray-500 text-center py-8">No public quests available.</div>
          )
        ) : (
          <div className="text-gray-500 text-center py-8">Loading quests...</div>
        )}
      </section>

      {/* 🧭 Public Posts */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">🧭 Public Posts</h2>
        {postBoard ? (
          postBoard.enrichedItems?.length ? (
            <Board
              board={postBoard}
              structure="list" // for post history
              user={profile}
              readOnly
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