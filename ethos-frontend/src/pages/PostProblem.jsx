import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PostProblem = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('/api/problems', { title, description });
      if (res.status === 201 || res.status === 200) {
        navigate('/'); // Go back to homepage or problem feed
      }
    } catch (err) {
      console.error(err);
      setError('Failed to post problem. Please try again.');
    }
  };

  return (
    <div className="post-problem-container">
      <h2>Post a New Problem</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit">Submit Problem</button>
      </form>
    </div>
  );
};

export default PostProblem;