// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBoardContext } from '../contexts/BoardContext';
import Board from '../components/boards/Board';
import { axiosWithAuth } from '../utils/authUtils';

const HomePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { boards, selectedBoard, loading: boardLoading } = useBoardContext();

  const [featuredBoards, setFeaturedBoards] = useState([]);
  const [defaultFeedBoardId, setDefaultFeedBoardId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, homeFeedRes] = await Promise.all([
          axiosWithAuth.get('/boards?featured=true'),
          axiosWithAuth.get('/boards/default/home')
        ]);

        setFeaturedBoards(featuredRes.data || []);
        setDefaultFeedBoardId(homeFeedRes.data?.id || null);
      } catch (err) {
        console.error('[HomePage] Failed to load boards:', err);
      }
    };

    fetchData();
  }, []);

  if (authLoading || boardLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading session...
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Welcome to Ethos</h1>
        <p className="text-lg text-gray-600">
          A place to explore ideas, share quests, and collaborate.
        </p>
      </header>

      {/* 🔄 Latest Posts Board */}
      <section className="mb-12">
        {defaultFeedBoardId ? (
          <Board boardId={defaultFeedBoardId} structure="list" title="🧭 Latest Posts" />
        ) : selectedBoard ? (
          <Board boardId={selectedBoard.id} structure="list" title="🧭 Latest Posts" />
        ) : (
          <div className="text-gray-500 text-center py-8">No posts to display yet.</div>
        )}
      </section>

      {/* 📌 Featured Boards */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📋 Featured Boards</h2>
        <div className="space-y-6">
          {featuredBoards.length > 0 ? (
            featuredBoards.map((board) => (
              <Board
                key={board.id}
                boardId={board.id}
                title={`📌 ${board.title || 'Untitled Board'}`}
                structure="list"
              />
            ))
          ) : (
            <div className="text-gray-500 text-center py-8">No featured boards available.</div>
          )}
        </div>
      </section>
    </main>
  );
};

export default HomePage;