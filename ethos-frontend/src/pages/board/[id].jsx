import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Board from '../../components/boards/Board';
import { axiosWithAuth } from '../../utils/authUtils';
import { useBoardContext } from '../../contexts/BoardContext';

const BoardPage = () => {
  const { id } = useParams();
  const [boardData, setBoardData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { setBoardMeta } = useBoardContext();

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await axiosWithAuth.get(`/api/boards/${id}?enrich=true`);
        setBoardData(res.data);
        setBoardMeta({ id: res.data.id, title: res.data.title, layout: res.data.structure });
      } catch (err) {
        console.error('Error loading board:', err);
        setError('Board not found or inaccessible.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [id, setBoardMeta]);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading board...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!boardData) return null;

  return (
    <main className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{boardData.title}</h1>

      <Board
        board={boardData}
        structure={boardData.structure || 'grid'}
        editable={true}
        title={boardData.title}
      />
    </main>
  );
};

export default BoardPage;