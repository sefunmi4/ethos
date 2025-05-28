// src/pages/post/new.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosWithAuth } from '../../utils/authUtils';

const NewPost = () => {
  const [content, setContent] = useState('');
  const [type, setType] = useState('free_speech');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosWithAuth.post('/api/posts', { content, type });
      navigate('/profile');
    } catch (err) {
      console.error('Failed to create post', err);
    }
  };

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Create New Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="free_speech">Free Speech</option>
          <option value="request">Request</option>
        </select>
        <textarea
          rows={6}
          placeholder="Write your post..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Post</button>
      </form>
    </main>
  );
};

export default NewPost;
