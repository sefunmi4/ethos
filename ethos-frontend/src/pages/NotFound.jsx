// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-bold">404: You’ve wandered into the void 🌌</h1>
      <p className="text-sm text-gray-500 mt-2">No quests here, only echoes...</p>
      <Link
        to="/"
        className="text-blue-600 hover:underline text-sm font-medium"
      >
        Return to homepage
      </Link>
    </div>
  );
};

export default NotFound;