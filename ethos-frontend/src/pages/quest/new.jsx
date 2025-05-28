// 🔄 Example usage for CreateQuest.jsx
// src/pages/CreateQuest.jsx
import React, { useState } from 'react';
import CreateModal from '../components/create/CreateModal';

const CreateQuest = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ➕ New Quest
      </button>
      <CreateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(quest) => console.log('Quest created:', quest)}
        title="Start a New Quest"
        type="quest_log"
        context={{}}
      />
    </div>
  );
};

export default CreateQuest;