import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBoardContext } from '../contexts/BoardContext';
import { useSocket } from '../hooks/useSocket';
import { usePermissions } from '../hooks/usePermissions';

import Board from '../components/board/Board';
import { fetchFeaturedBoards, fetchDefaultHomeBoard } from '../api/board';

import type { User } from '../types/userTypes';
import type { BoardData } from '../types/boardTypes';
import type { PostType } from '../types/postTypes';
import type { Visibility } from '../types/common';

const HomePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { selectedBoard, loading: boardLoading, setBoardMeta } = useBoardContext();
  const { socket } = useSocket();
  const { hasAccessToBoard } = usePermissions();

  const [featuredBoards, setFeaturedBoards] = useState<BoardData[]>([]);
  const [defaultFeedBoardId, setDefaultFeedBoardId] = useState<string | null>(null);

  // Update board metadata and replace featured board on update
  const handleBoardUpdate = useCallback(
    (updatedBoard: BoardData) => {
      if (updatedBoard?.id === defaultFeedBoardId) {
        setBoardMeta({
          id: updatedBoard.id,
          title: updatedBoard.title,
          layout: updatedBoard.structure,
        });
      }

      setFeaturedBoards((prev) =>
        prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
      );
    },
    [defaultFeedBoardId, setBoardMeta]
  );

  // Listen for real-time socket board updates
  useEffect(() => {
    if (!socket) return;
    socket.on('board:update', handleBoardUpdate);
    return () => {
      socket.off('board:update', handleBoardUpdate);
    };
  }, [socket, handleBoardUpdate]);

  // Load default + featured boards
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const [featured, defaultBoard] = await Promise.all([
          fetchFeaturedBoards(),
          fetchDefaultHomeBoard(),
        ]);
        setFeaturedBoards(featured || []);
        setDefaultFeedBoardId(defaultBoard?.id || null);
      } catch (err) {
        console.error('[HomePage] Failed to load boards:', err);
      }
    };
    loadBoards();
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

      {/* Default board or selected board */}
      <section className="mb-12">
        {defaultFeedBoardId ? (
          <Board
            boardId={defaultFeedBoardId}
            structure="list"
            title="🧭 Latest Posts"
            user={user as User}
            filter={{
              visibility: 'public' satisfies Visibility,
              type: 'free_speech' satisfies PostType,
            }}
          />
        ) : selectedBoard ? (
          <Board
            boardId={selectedBoard}
            structure="list"
            title="🧭 Latest Posts"
            user={user as User}
          />
        ) : (
          <div className="text-gray-500 text-center py-8">No posts to display yet.</div>
        )}
      </section>

      {/* Featured boards (with permissions filter) */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📋 Featured Boards</h2>
        <div className="space-y-6">
          {featuredBoards.length > 0 ? (
            featuredBoards
              .filter((board) => hasAccessToBoard(board.id))
              .map((board) => (
                <Board
                  key={board.id}
                  boardId={board.id}
                  title={`📌 ${board.title || 'Untitled Board'}`}
                  structure="list"
                  user={user as User}
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