import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Board from '../../components/boards/Board';
import { useBoard } from '../../hooks/useBoards';
import { useBoardContext } from '../../contexts/BoardContext';

const BoardPage = () => {
  const { id } = useParams();
  const { data: boardData, isLoading, error } = useBoard(id);
  const { setBoardMeta } = useBoardContext();

  useEffect(() => {
    if (boardData) {
      setBoardMeta({
        id: boardData.id,
        title: boardData.title,
        layout: boardData.structure,
      });
    }
  }, [boardData, setBoardMeta]);

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading board...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Board not found or inaccessible.</div>;
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