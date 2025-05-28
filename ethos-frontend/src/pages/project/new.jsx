

// src/pages/CreateProject.jsx
import React, { useState } from 'react';
import CreateModal from '../components/create/CreateModal';

const CreateProject = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        ➕ New Project
      </button>
      <CreateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(project) => console.log('Project created:', project)}
        title="Launch New Project"
        type="project"
        context={{}}
      />
    </div>
  );
};

export default CreateProject;
