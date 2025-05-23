import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BoardProvider } from '../contexts/BoardContext';
import PostEditor from '../components/posts/PostEditor';

const NewPostPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Checking session...</div>;
  }

  if (!user) {
    return <div className="text-center py-12 text-red-500">You must be logged in to create a post.</div>;
  }

  return (
    <BoardProvider initialStructure="list">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">✏️ Create New Post</h1>
          <p className="text-gray-600">Share a thought, request help, or log your latest quest update.</p>
        </header>

        <section>
          <PostEditor />
        </section>
      </main>
    </BoardProvider>
  );
};

export default NewPostPage;