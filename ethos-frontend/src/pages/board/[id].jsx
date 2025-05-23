import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BoardProvider } from '../../contexts/BoardContext';
import Board from '../../components/boards/Board';
import BoardToolbar from '../../components/boards/BoardToolbar';
import BoardItemCard from '../../components/boards/BoardItemCard';

const BoardPage = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await axios.get(`/s${id}`);
        setBoard(res.data);
        setFilters(res.data.filters || {});
        setViewMode(res.data.structure || 'list');
      } catch (err) {
        console.error('Error loading board:', err);
        setError('Failed to load board.');
      }
    };
    fetchBoard();
  }, [id]);

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!board) {
    return <div className="text-center py-12 text-gray-500">Loading board...</div>;
  }

  return (
    <BoardProvider initialStructure={viewMode} initialFilters={filters}>
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📂 {board.title}</h1>
          <p className="text-gray-600">
            {board.description || 'This board displays a collection of items.'}
          </p>
        </header>

        <section className="mb-8">
          <BoardToolbar
            viewMode={viewMode}
            setViewMode={setViewMode}
            filters={filters}
            setFilters={setFilters}
            title="Board Items"
          />
        </section>

        <Board
          board={board}
          structure={viewMode}
          renderItem={(item) => (
            <BoardItemCard
              key={item.id}
              title={item.title || 'Untitled'}
              subtitle={item.type === 'quest' ? 'Quest' : item.type}
              data={item}
            />
          )}
        />
      </main>
    </BoardProvider>
  );
};

export default BoardPage;