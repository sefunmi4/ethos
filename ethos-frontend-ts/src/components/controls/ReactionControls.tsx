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
import CreatePost from '../post/CreatePost';
import {
  updateReaction,
  addRepost,
  fetchReactions,
  fetchRepostCount,
  getUserRepost,
} from '../../api/post';
import type { Post, ReactionType, ReactionCountMap  } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface ReactionControlsProps {
  post: Post;
  user?: User;
  onUpdate?: (data: any) => void;
}

const ReactionControls: React.FC<ReactionControlsProps> = ({ post, user, onUpdate }) => {
  const [reactions, setReactions] = useState({ like: false, heart: false });
  const [counts, setCounts] = useState({ like: 0, heart: 0, repost: 0 });
  const [loading, setLoading] = useState(true);
  const [userRepostId, setUserRepostId] = useState<string | null>(null);

  const [showReplyPanel, setShowReplyPanel] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!post?.id) return;
      try {
        const [allReactions, repostCountRes, userRepostRes] = await Promise.all([
          fetchReactions(post.id),
          fetchRepostCount(post.id),
          user?.id ? getUserRepost(post.id) : Promise.resolve(null),
        ]);

        const userReactions = allReactions.filter((r: any) => r.userId === user?.id);
        const countMap: ReactionCountMap = { like: 0, heart: 0, repost: 0 };

        allReactions.forEach((r: { type: ReactionType }) => {
          if (r.type === 'like' || r.type === 'heart') {
            countMap[r.type] += 1;
          }
        });
        countMap.repost = repostCountRes?.count ?? 0;

        setCounts(countMap);
        setReactions({
          like: userReactions.some((r: any) => r.type === 'like'),
          heart: userReactions.some((r: any) => r.type === 'heart'),
        });
        setUserRepostId(userRepostRes?.id || null);
      } catch (err) {
        console.error('[ReactionControls] Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [post.id, user?.id]);

  const handleToggleReaction = async (type: 'like' | 'heart') => {
    if (!user?.id) return;
    const isActive = !reactions[type];
    setReactions(prev => ({ ...prev, [type]: isActive }));
    setCounts(prev => ({ ...prev, [type]: prev[type] + (isActive ? 1 : -1) }));

    try {
      await updateReaction(post.id, type, isActive);
    } catch (err) {
      console.error(`[ReactionControls] Failed to toggle ${type}:`, err);
      setReactions(prev => ({ ...prev, [type]: !isActive }));
      setCounts(prev => ({ ...prev, [type]: prev[type] - (isActive ? 1 : -1) }));
    }
  };

  const handleRepost = async () => {
    if (!user?.id || repostLoading) return;
    setRepostLoading(true);
    try {
      const res = await addRepost(post);
      if (res?.id) {
        setCounts(prev => ({ ...prev, repost: prev.repost + 1 }));
        setUserRepostId(res.id);
        onUpdate?.(res);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to repost:', err);
    } finally {
      setRepostLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-4 items-center text-sm text-gray-500">
        <button
          className={clsx('flex items-center gap-1', reactions.like && 'text-blue-600')}
          onClick={() => handleToggleReaction('like')}
          disabled={loading || !user}
        >
          {reactions.like ? <FaThumbsUp /> : <FaRegThumbsUp />} {counts.like || ''}
        </button>

        <button
          className={clsx('flex items-center gap-1', reactions.heart && 'text-red-500')}
          onClick={() => handleToggleReaction('heart')}
          disabled={loading || !user}
        >
          {reactions.heart ? <FaHeart /> : <FaRegHeart />} {counts.heart || ''}
        </button>

        <button
          className={clsx('flex items-center gap-1', userRepostId && 'text-indigo-600')}
          onClick={handleRepost}
          disabled={loading || repostLoading || !user}
        >
          <FaRetweet /> {counts.repost || ''}
        </button>

        <button
          className={clsx('flex items-center gap-1', showReplyPanel && 'text-green-600')}
          onClick={() => setShowReplyPanel(prev => !prev)}
        >
          <FaReply /> {showReplyPanel ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {showReplyPanel && (
        <div className="mt-3">
          <CreatePost
            replyTo={post}
            onSave={(newReply: any) => {
              onUpdate?.(newReply);
              setShowReplyPanel(false);
            }}
            onCancel={() => setShowReplyPanel(false)}
          />
        </div>
      )}
    </>
  );
};

export default ReactionControls;