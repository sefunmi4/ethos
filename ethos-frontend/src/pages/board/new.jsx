// src/pages/CreateBoard.jsx
import React, { useState } from 'react';
import CreateModal from '../components/create/CreateModal';

const CreateBoard = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        ➕ New Board
      </button>
      <CreateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(board) => console.log('Board created:', board)}
        title="Create New Board"
        type="board"
        context={{}}
      />
    </div>
  );
};

export default CreateBoard;