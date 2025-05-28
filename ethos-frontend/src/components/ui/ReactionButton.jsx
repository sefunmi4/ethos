// frontend/components/ReactionButton.jsx
import React, { useEffect, useState } from 'react';
import { FaThumbsUp, FaRegThumbsUp, FaReply, FaRetweet, FaRegHeart, FaHeart } from 'react-icons/fa';
import clsx from 'clsx';
import { axiosWithAuth } from '../../utils/authUtils';

const ReactionButton = ({ postId, userId }) => {
  const [reactions, setReactions] = useState({ like: false, heart: false });
  const [counts, setCounts] = useState({ like: 0, heart: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const res = await axiosWithAuth.get(`/posts/${postId}/reactions`);
        const userReactions = res.data.filter(r => r.userId === userId);
        const countMap = res.data.reduce((acc, r) => {
          acc[r.type] = (acc[r.type] || 0) + 1;
          return acc;
        }, {});
        setCounts(countMap);
        setReactions({
          like: userReactions.some(r => r.type === 'like'),
          heart: userReactions.some(r => r.type === 'heart')
        });
      } catch (err) {
        console.error('[ReactionButton] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchReactions();
  }, [postId, userId]);

  const toggleReaction = async (type) => {
    const active = !reactions[type];
    setReactions(prev => ({ ...prev, [type]: active }));
    setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + (active ? 1 : -1) }));

    try {
      await axiosWithAuth.post(`/posts/${postId}/reactions`, {
        userId,
        type,
        active
      });
    } catch (err) {
      console.error(`[ReactionButton] Failed to toggle ${type}:`, err);
      setReactions(prev => ({ ...prev, [type]: !active }));
      setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) - (active ? 1 : -1) }));
    }
  };

  return (
    <div className="flex gap-4 items-center text-sm text-gray-500">
      <button
        className={clsx('flex items-center gap-1', reactions.like && 'text-blue-600')}
        onClick={() => toggleReaction('like')}
        disabled={loading}
      >
        {reactions.like ? <FaThumbsUp /> : <FaRegThumbsUp />} {counts.like || 0}
      </button>

      <button
        className={clsx('flex items-center gap-1', reactions.heart && 'text-red-500')}
        onClick={() => toggleReaction('heart')}
        disabled={loading}
      >
        {reactions.heart ? <FaHeart /> : <FaRegHeart />} {counts.heart || 0}
      </button>

      <button
        className="flex items-center gap-1 hover:text-green-600"
        onClick={() => alert('Reply modal')}
      >
        <FaReply /> Reply
      </button>

      <button
        className="flex items-center gap-1 hover:text-purple-600"
        onClick={() => alert('Repost modal')}
      >
        <FaRetweet /> Repost
      </button>
    </div>
  );
};

export default ReactionButton;
