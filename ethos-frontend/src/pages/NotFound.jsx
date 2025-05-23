import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <section className="text-center max-w-md">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          You’ve wandered into the void 🌌
        </h2>
        <p className="text-gray-500 mb-6">
          The page you’re looking for doesn’t exist. No quests here, only echoes...
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          Return to Homepage
        </Link>
      </section>
    </main>
  );
};

export default NotFound;