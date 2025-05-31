import React, { useState } from 'react';
import Modal from './Modal';
import { axiosWithAuth } from '../../utils/authUtils';

const RepostModal = ({ post, user, onClose, onRepost }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRepost = async () => {
    if (!user?.id || !post?.id) return;

    setIsSubmitting(true);
    try {
      const newPost = {
        type: 'free_speech',
        content: comment,
        repostedFrom: {
          id: post.id,
          username: post?.authorUsername || 'unknown',
        },
        visibility: 'public',
        tags: ['repost'],
      };

      const response = await axiosWithAuth.post('/posts', newPost);
      onRepost?.(response.data);
      onClose();
    } catch (error) {
      console.error('[RepostModal] Failed to repost:', error);
      alert('Error while reposting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Repost">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          You're about to repost this post. Optionally add a comment below to include your own thoughts.
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)"
          rows={4}
          className="w-full border rounded p-2"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleRepost}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {isSubmitting ? 'Reposting...' : 'Repost'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RepostModal;