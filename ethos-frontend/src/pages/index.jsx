import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BoardProvider } from '../contexts/BoardContext';
import Board from '../components/boards/Board';
import BoardToolbar from '../components/boards/BoardToolbar';
import BoardAddItem from '../components/boards/BoardAddItem';
import axios from 'axios';

const HomePage = () => {
  const { user, loading } = useAuth();
  const [featuredBoards, setFeaturedBoards] = useState([]);
  const [defaultFeedBoard, setDefaultFeedBoard] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const boardRes = await axios.get('/api/boards?featured=true');
        const feedBoardRes = await axios.get('/api/boards/default/home');

        setFeaturedBoards(boardRes.data);
        setDefaultFeedBoard(feedBoardRes.data);
      } catch (error) {
        console.error('Error loading home data:', error);
      }
    };

    fetchData();
  }, []);

  const handleAddItem = (boardId, newItem) => {
    const item = {
      id: crypto.randomUUID(),
      type: newItem.type,
      content: newItem.content,
      authorId: user?.id || 'guest',
      timestamp: new Date().toISOString(),
      visibility: 'public',
      questId: newItem.questId || null,
      assignedRoles: newItem.assignedRoles || [],
    };
  
    if (defaultFeedBoard?.id === boardId) {
      setDefaultFeedBoard(prev => ({
        ...prev,
        items: [item, ...(prev.items || [])],
      }));
    } else {
      setFeaturedBoards(prev =>
        prev.map(board =>
          board.id === boardId
            ? { ...board, items: [item, ...(board.items || [])] }
            : board
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading session...
      </div>
    );
  }

  return (
    <BoardProvider initialStructure="list">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Welcome to Ethos</h1>
          <p className="text-lg text-gray-600">
            A place to explore ideas, share quests, and collaborate.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🧭 Latest Posts</h2>
          {defaultFeedBoard ? (
            <>
              <BoardToolbar title="Latest Posts" filters={defaultFeedBoard.filters} />
              <BoardAddItem onCreate={(text) => handleAddItem(defaultFeedBoard.id, text)} />
              <Board board={defaultFeedBoard} />
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">Loading feed...</div>
          )}
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📋 Featured Boards</h2>
          <div className="space-y-6">
            {featuredBoards.map((board) => (
              <div key={board.id} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                <BoardToolbar title={board.title || "Untitled Board"} filters={board.filters} />
                <Board board={board} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </BoardProvider>
  );
};

export default HomePage;