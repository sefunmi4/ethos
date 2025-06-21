import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardContext } from '../../contexts/BoardContext';
import { ROUTES } from '../../constants/routes';
import {
  FaThumbsUp,
  FaRegThumbsUp,
  FaHeart,
  FaRegHeart,
  FaReply,
  FaRetweet,
  FaExpand,
  FaCompress,
} from 'react-icons/fa';
import clsx from 'clsx';
import CreatePost from '../post/CreatePost';
import {
  updateReaction,
  addRepost,
  removeRepost,
  fetchReactions,
  fetchRepostCount,
  fetchUserRepost,
} from '../../api/post';
import type { Post, ReactionType, ReactionCountMap  } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface ReactionControlsProps {
  post: Post;
  user?: User;
  onUpdate?: (data: any) => void;
  replyCount?: number;
  showReplies?: boolean;
  onToggleReplies?: () => void;
  /** Override default reply behavior */
  replyOverride?: { label: string; onClick: () => void };
  /** Treat reply action as coming from the timeline board */
  isTimeline?: boolean;
}

const ReactionControls: React.FC<ReactionControlsProps> = ({
  post,
  user,
  onUpdate,
  replyCount,
  showReplies,
  onToggleReplies,
  replyOverride,
  isTimeline,
}) => {
  const [reactions, setReactions] = useState({ like: false, heart: false });
  const [counts, setCounts] = useState({ like: 0, heart: 0, repost: 0 });
  const [loading, setLoading] = useState(true);
  const [userRepostId, setUserRepostId] = useState<string | null>(null);

  const [showReplyPanel, setShowReplyPanel] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { selectedBoard } = useBoardContext() || {};
  const isTimelineBoard = isTimeline ?? selectedBoard === 'timeline-board';

  useEffect(() => {
    const fetchData = async () => {
      if (!post?.id) return;
      try {
        const [allReactions, repostCountRes, userRepostRes] = await Promise.all([
          fetchReactions(post.id),
          fetchRepostCount(post.id),
          user?.id ? fetchUserRepost(post.id) : Promise.resolve(null),
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
      if (userRepostId) {
        await removeRepost(userRepostId);
        setCounts(prev => ({ ...prev, repost: prev.repost - 1 }));
        setUserRepostId(null);
        onUpdate?.({ id: userRepostId, removed: true });
      } else {
        const res = await addRepost(post);
        if (res?.id) {
          setCounts(prev => ({ ...prev, repost: prev.repost + 1 }));
          setUserRepostId(res.id);
          onUpdate?.(res);
        }
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to toggle repost:', err);
    } finally {
      setRepostLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-4 items-center text-sm text-gray-500 dark:text-gray-400">
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
          className={clsx(
            'flex items-center gap-1',
            post.type !== 'task' && post.type !== 'commit' && showReplyPanel && 'text-green-600'
          )}
          onClick={() => {
            if (replyOverride) {
              replyOverride.onClick();
            } else if (post.type === 'task' && post.questId) {
              navigate(ROUTES.BOARD(`log-${post.questId}`));
            } else if (post.type === 'commit') {
              navigate(ROUTES.POST(post.id));
            } else if (isTimelineBoard) {
              navigate(ROUTES.POST(post.id) + '?reply=1');
            } else {
              setShowReplyPanel(prev => !prev);
            }
          }}
        >
          <FaReply />{' '}
          {replyOverride
            ? replyOverride.label
            : post.type === 'task'
            ? 'Quest Log'
            : post.type === 'commit'
            ? 'File Change View'
            : showReplyPanel
            ? 'Cancel'
            : 'Reply'}
        </button>

        {(post.type === 'task' || post.type === 'commit') && (
          <button className="flex items-center gap-1" onClick={() => setExpanded(prev => !prev)}>
            {expanded ? <FaCompress /> : <FaExpand />} {expanded ? 'Collapse View' : 'Expand View'}
          </button>
        )}

      </div>

      {showReplyPanel && !replyOverride && (
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

      {expanded && post.type === 'task' && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {post.questId && <div>Quest ID: {post.questId}</div>}
          {post.status && <div>Status: {post.status}</div>}
        </div>
      )}

      {expanded && post.type === 'commit' && (
        <div className="mt-3 text-sm">
          {post.commitSummary && (
            <div className="mb-1 italic text-secondary dark:text-secondary">{post.commitSummary}</div>
          )}
          {post.gitDiff && (
            <pre className="whitespace-pre-wrap overflow-x-auto bg-gray-50 p-2 border text-xs">
              {post.gitDiff}
            </pre>
          )}
        </div>
      )}
    </>
  );
};

export default ReactionControls;