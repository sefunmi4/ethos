import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useSocketListener } from '../hooks/useSocket';
import { useBoard } from '../hooks/useBoard';
import { useQuest } from '../hooks/useQuest';
import { usePost } from '../hooks/usePost';

import Banner from '../components/ui/Banner';
import Board from '../components/board/Board';
import { Spinner } from '../components/ui';
import ReviewForm from '../components/ReviewForm';

import type { EnrichedQuest, Quest } from '../types/questTypes';
import type { EnrichedPost, Post } from '../types/postTypes';

import type { BoardData } from '../types/boardTypes';
import type { User } from '../types/userTypes';

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  const [profile, setProfile] = useState<User | null>(null);
  const [questBoard, setQuestBoard] = useState<BoardData | null>(null);
  const [postBoard, setPostBoard] = useState<BoardData | null>(null);
  const [error, setError] = useState('');

  const { loadPublicBoards } = useBoard();
  const { fetchPostsForBoard, enrichPosts } = usePost();
  const { fetchQuestsForBoard, enrichQuests } = useQuest();

  // 🧠 Load profile and related boards
  useEffect(() => {
    if (!userId) return;

    const fetchProfileData = async () => {
      try {
        const { profile, quests, posts } = await loadPublicBoards(userId);
        const enrichedQuests: EnrichedQuest[] =
          (quests.enrichedItems as EnrichedQuest[]) ||
          (await enrichQuests(quests.items as unknown as (Quest | Post)[]));
        const enrichedPosts: EnrichedPost[] =
          (posts.enrichedItems as EnrichedPost[]) ||
          (await enrichPosts(posts.items as unknown as Post[]));

        setProfile(profile); //todo: Argument of type '{ id: string; }' is not assignable to parameter of type 'SetStateAction<User | null>'.
        setQuestBoard({ ...quests, enrichedItems: enrichedQuests });
        setPostBoard({ ...posts, enrichedItems: enrichedPosts });
      } catch (err) {
        console.error('[PublicProfilePage] Failed to load:', err);
        setError('User not found or profile is private.');
      }
    };

    fetchProfileData();
  }, [userId]);

  // 🔁 Real-time board updates (via WebSocket)
  useSocketListener('board:update', async (updatedBoard: BoardData) => {
    if (!userId || updatedBoard.userId !== userId) return;

    try {
      // 🧭 If it's a quest board
      if (updatedBoard.id === questBoard?.id) {
        const quests = await fetchQuestsForBoard(updatedBoard.id, userId);
        const enriched = await enrichQuests(quests);
        setQuestBoard({ ...updatedBoard, enrichedItems: enriched });
      }

      // 📬 If it's a post board
      if (updatedBoard.id === postBoard?.id) {
        const posts = await fetchPostsForBoard(updatedBoard.id, userId);
        const enriched = await enrichPosts(posts);
        setPostBoard({ ...updatedBoard, enrichedItems: enriched });
      }
    } catch (err) {
      console.error('[Socket board:update] Failed to fetch or enrich items:', err);
    }
  });

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  if (!profile) {
    return <Spinner />;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 bg-soft dark:bg-soft-dark">
      <Banner user={profile} readOnly />

      {/* 📘 Public Quests */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">📘 Public Quests</h2>
        {questBoard ? (
          questBoard.enrichedItems?.length ? (
            <Board
              board={questBoard}
              layout="graph" // for quest overview in graph/tree format
              user={profile}
              readOnly
            />
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">No public quests available.</div>
          )
        ) : (
          <Spinner />
        )}
      </section>

      {/* 🧭 Public Posts */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">🧭 Public Posts</h2>
        {postBoard ? (
          postBoard.enrichedItems?.length ? (
            <Board
              board={postBoard}
              layout="grid" // for post history
              user={profile}
              readOnly
            />
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">No public posts found.</div>
          )
        ) : (
          <Spinner />
        )}
      </section>

      {/* ⭐ Review Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">⭐ Leave a Review</h2>
        <ReviewForm targetType="creator" modelId={profile.id} />
      </section>
    </main>
  );
};

export default PublicProfilePage;