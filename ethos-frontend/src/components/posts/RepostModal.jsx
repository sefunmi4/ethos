import React, { useState } from 'react';
import LinkControls from './PostEditor/LinkControls';
import axios from 'axios';

const RepostModal = ({ originalPost, onClose, onRepost }) => {
  const [content, setContent] = useState(originalPost.content || '');
  const [questId, setQuestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create repost on the backend
      const res = await axios.post(`/api/posts/${originalPost.id}/repost`, {
        content,
        questId: questId || null,
        linkType: 'repost',
      });

      const newPost = res.data;

      // 2. Optionally register the post to the quest map
      if (questId) {
        await axios.post(`/api/quests/${questId}/link`, { postId: newPost.id });
      }

      onRepost?.(newPost);
      onClose();
    } catch (err) {
      console.error('Repost failed:', err);
      setError('Failed to repost. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
      <div className="bg-white rounded shadow-lg max-w-lg w-full p-6 relative z-50">
        <h2 className="text-xl font-semibold mb-4">🔁 Repost This Content</h2>

        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Update or keep original message..."
          />

          <LinkControls value={questId} onChange={setQuestId} />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm text-gray-600 hover:underline"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Repost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepostModal;