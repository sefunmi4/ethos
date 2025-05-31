import React, { useEffect, useState } from 'react';
import {
  FaThumbsUp,
  FaRegThumbsUp,
  FaHeart,
  FaRegHeart,
  FaReply,
  FaRetweet,
} from 'react-icons/fa';
import clsx from 'clsx';
import { axiosWithAuth } from '../../../utils/authUtils';
import CreateReplyPost from '../../posts/CreateReplyPost';

const ReactionButtons = ({ post, user, onUpdate }) => {
  const [reactions, setReactions] = useState({ like: false, heart: false });
  const [counts, setCounts] = useState({ like: 0, heart: 0, repost: 0 });
  const [loading, setLoading] = useState(true);

  const [showReplyPanel, setShowReplyPanel] = useState(false);
  const [asRepost, setAsRepost] = useState(false);
  const [linkedItem, setLinkedItem] = useState(null);
  const [comment, setComment] = useState('');
  const [postType, setPostType] = useState('free_speech');

  const [userRepostId, setUserRepostId] = useState(null);
  const [repostLoading, setRepostLoading] = useState(false);   

  useEffect(() => {
    const fetchCountsAndReactions = async () => {
      if (!post?.id) return;
      try {
        const [reactionsRes, repostRes, userRepostsRes] = await Promise.all([
          axiosWithAuth.get(`/posts/${post.id}/reactions`),
          user?.id ? axiosWithAuth.get(`/posts/${post.id}/repostCount`) : Promise.resolve({ data: { count: 0 } }),
          user?.id ? axiosWithAuth.get(`/posts/${post.id}/userRepost`) : Promise.resolve({ data: null }),
        ]);

        const allReactions = reactionsRes.data;
        const userReactions = allReactions.filter(r => r.userId === user?.id);
        const countMap = allReactions.reduce((acc, r) => {
          acc[r.type] = (acc[r.type] || 0) + 1;
          return acc;
        }, {});
        countMap.repost = repostRes.data.count ?? 0;

        setCounts(countMap);
        setReactions({
          like: userReactions.some(r => r.type === 'like'),
          heart: userReactions.some(r => r.type === 'heart'),
        });

        setUserRepostId(userRepostsRes?.data?.id || null);
      } catch (err) {
        console.error('[ReactionButtons] Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountsAndReactions();
  }, [post.id, user?.id]);

  const toggleReaction = async (type) => {
    if (!user?.id) return;
    const isActive = !reactions[type];

    setReactions(prev => ({ ...prev, [type]: isActive }));
    setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + (isActive ? 1 : -1) }));

    try {
      await axiosWithAuth.post(`/posts/${post.id}/reactions`, {
        type,
        active: isActive,
      });
    } catch (err) {
      console.error(`[ReactionButtons] Failed to toggle ${type}:`, err);
      // revert UI
      setReactions(prev => ({ ...prev, [type]: !isActive }));
      setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) - (isActive ? 1 : -1) }));
    }
  };

  const handleRepost = async () => {
    if (!user?.id || repostLoading) return;
    setRepostLoading(true);
  
    try {
      if (userRepostId) {
        // User has already reposted → delete their repost
        const res = await axiosWithAuth.delete(`/posts/${userRepostId}`);
        if (res.status === 200) {
          setCounts(prev => ({ ...prev, repost: Math.max((prev.repost || 1) - 1, 0) }));
          setUserRepostId(null);
          onUpdate?.({ deleted: true, id: userRepostId });
        }
      } else {
        // User has not reposted yet → create a repost
        const payload = {
          type: 'repost',
          content: comment || post.content || '[repost]',
          visibility: 'public',
          replyTo: null, // ✅ ensure repost is top-level
          repostedFrom: {
            id: post.id,
            username: post.author?.username || 'unknown',
            originalPostId: post.id,
            originalContent: post.content || '',
          },
          linkedItems: linkedItem ? [linkedItem] : [],
        };
  
        const res = await axiosWithAuth.post('/posts', payload);
        if (res.status === 201) {
          setComment('');
          setAsRepost(false);
          setShowReplyPanel(false);
          setLinkedItem(null);
          setCounts(prev => ({ ...prev, repost: (prev.repost || 0) + 1 }));
          setUserRepostId(res.data.id);
          onUpdate?.(res.data);
        }
      }
    } catch (err) {
      console.error('[ReactionButtons] Repost toggle failed:', err);
      alert('Failed to toggle repost.');
    } finally {
      setRepostLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-4 items-center text-sm text-gray-500">
        {/* 👍 Like */}
        <button
          className={clsx('flex items-center gap-1', reactions.like && 'text-blue-600')}
          onClick={() => toggleReaction('like')}
          disabled={loading || !user}
        >
          {reactions.like ? <FaThumbsUp /> : <FaRegThumbsUp />}
          {user && counts.like > 0 ? ` ${counts.like}` : ''}
        </button>

        {/* ❤️ Heart */}
        <button
          className={clsx('flex items-center gap-1', reactions.heart && 'text-red-500')}
          onClick={() => toggleReaction('heart')}
          disabled={loading || !user}
        >
          {reactions.heart ? <FaHeart /> : <FaRegHeart />}
          {user && counts.heart > 0 ? ` ${counts.heart}` : ''}
        </button>

        {/* 🔁 Repost */}
        <button
          className={clsx('flex items-center gap-1', userRepostId && 'text-indigo-600')}
          onClick={handleRepost}
          disabled={loading || repostLoading || !user}
        >
          <FaRetweet />
          {user && counts.repost > 0 ? ` ${counts.repost}` : ''}
        </button>

        {/* 💬 Reply */}
        <button
          className={clsx('flex items-center gap-1', showReplyPanel && 'text-green-600')}
          onClick={() => setShowReplyPanel(prev => !prev)}
        >
          <FaReply /> {showReplyPanel ? 'Cancel' : 'Reply'}
        </button>
      </div>
      
      {showReplyPanel && (
        <CreateReplyPost
          post={post}
          onReplySubmit={(newReply) => {
            onUpdate?.(newReply);
          }}
          onCancel={() => {
            setShowReplyPanel(false);
            setComment('');
            setLinkedItem(null);
          }}
          onUpdate={(data) => onUpdate?.(data)}
        />
      )}
    </>
  );
};

export default ReactionButtons;