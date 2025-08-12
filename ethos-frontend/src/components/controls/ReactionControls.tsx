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
  FaHandsHelping,
  FaExpand,
  FaCompress,
  FaCheckSquare,
  FaRegCheckSquare,
  FaUserPlus,
  FaUserCheck,
  FaBell,
} from 'react-icons/fa';
import clsx from 'clsx';
import CreatePost from '../post/CreatePost';
import TaskCard from '../quest/TaskCard';
import {
  updateReaction,
  addRepost,
  removeRepost,
  fetchReactions,
  fetchRepostCount,
  fetchUserRepost,
  requestHelp,
  removeHelpRequest,
  acceptRequest,
  unacceptRequest,
  archivePost,
  unarchivePost,
  followPost,
  unfollowPost,
} from '../../api/post';
import type { Post, ReactionType, ReactionCountMap, Reaction } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import type { BoardItem } from '../../contexts/BoardContextTypes';

interface ReactionControlsProps {
  post: Post;
  user?: User;
  onUpdate?: (data: Post | { id: string; removed?: boolean }) => void;
  replyCount?: number;
  showReplies?: boolean;
  onToggleReplies?: () => void;
  /** Override default reply behavior */
  replyOverride?: { label: string; onClick: () => void };
  /** Treat reply action as coming from the timeline board */
  isTimeline?: boolean;
  /** Board ID used for context-specific actions */
  boardId?: string;
  /** Notify parent when reply panel toggles */
  onReplyToggle?: (open: boolean) => void;
  /** Optional timestamp to display */
  timestamp?: string;
  /** Controlled expand state */
  expanded?: boolean;
  /** Toggle expand state when controlled */
  onToggleExpand?: () => void;
}

const ReactionControls: React.FC<ReactionControlsProps> = ({
  post,
  user,
  onUpdate,
  replyOverride,
  isTimeline,
  boardId,
  onReplyToggle,
  timestamp,
  expanded: expandedProp,
  onToggleExpand,
}) => {
  const [reactions, setReactions] = useState({ like: false, heart: false });
  const [counts, setCounts] = useState({ like: 0, heart: 0, repost: 0 });
  const [loading, setLoading] = useState(true);
  const [userRepostId, setUserRepostId] = useState<string | null>(null);

  const [showReplyPanel, setShowReplyPanel] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(post.type === 'task');
  const [completed, setCompleted] = useState(post.tags?.includes('archived') ?? false);
  const [joining, setJoining] = useState(false);
  const initialJoined = !!user && (
    post.authorId === user.id ||
    post.tags?.includes(`pending:${user.id}`) ||
    (post.collaborators || []).some(c => c.userId === user.id)
  );
  const [joined, setJoined] = useState(initialJoined);
  const [following, setFollowing] = useState(
    !!user && (post.followers || []).includes(user.id)
  );
  const [followerCount, setFollowerCount] = useState(post.followers?.length || 0);
  const navigate = useNavigate();
  const { selectedBoard, appendToBoard, boards } = useBoardContext() || {};
  const ctxBoardId = boardId || selectedBoard;
  const ctxBoardType = ctxBoardId ? boards?.[ctxBoardId]?.boardType : undefined;
  const isTimelineBoard = isTimeline ?? ctxBoardId === 'timeline-board';
  const isPostHistory = ctxBoardId === 'my-posts';
  const isPostBoard = isPostHistory || ctxBoardType === 'post';
  const isQuestRequest = ctxBoardId === 'quest-board' && post.tags?.includes('request');
  const isRequestCard =
    post.tags?.includes('request') && ctxBoardId === 'quest-board';
  const roleTag = post.tags?.find(t => t.toLowerCase().startsWith('role:'));
  const [helpRequested, setHelpRequested] = useState(post.helpRequest === true);
  const expanded = expandedProp !== undefined ? expandedProp : internalExpanded;

  useEffect(() => {
    const fetchData = async () => {
      if (!post?.id) return;
      try {
        const [allReactions, repostCountRes, userRepostRes] = await Promise.all([
          fetchReactions(post.id),
          fetchRepostCount(post.id),
          user?.id ? fetchUserRepost(post.id) : Promise.resolve(null),
        ]);

        const userReactions = allReactions.filter((r: Reaction) => r.userId === user?.id);
        const countMap: ReactionCountMap = { like: 0, heart: 0, repost: 0 };

        allReactions.forEach((r: { type: ReactionType }) => {
          if (r.type === 'like' || r.type === 'heart') {
            countMap[r.type] += 1;
          }
        });
        countMap.repost = repostCountRes?.count ?? 0;

        setCounts(countMap);
        setReactions({
          like: userReactions.some((r) => r.type === 'like'),
          heart: userReactions.some((r) => r.type === 'heart'),
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

  const handleRequestHelp = async () => {
    if (!user?.id) return;
    if (!helpRequested) {
      try {
        const { request: reqPost, subRequests } = await requestHelp(
          post.id,
          post.type
        );
        appendToBoard?.('quest-board', reqPost as unknown as BoardItem);
        appendToBoard?.('timeline-board', reqPost as unknown as BoardItem);
        subRequests.forEach(sr => {
          appendToBoard?.('quest-board', sr as unknown as BoardItem);
          appendToBoard?.('timeline-board', sr as unknown as BoardItem);
          onUpdate?.(sr);
        });
        setHelpRequested(true);
        onUpdate?.(reqPost);
      } catch (err) {
        console.error('[ReactionControls] Failed to request help:', err);
      }
    } else {
      try {
        await removeHelpRequest(post.id);
        setHelpRequested(false);
        onUpdate?.({ ...post, helpRequest: false, needsHelp: false } as Post);
      } catch (err) {
        console.error('[ReactionControls] Failed to cancel help request:', err);
      }
    }
  };

  const handleMarkComplete = async () => {
    if (!user || user.id !== post.authorId) return;
    try {
      if (completed) {
        await unarchivePost(post.id);
        setCompleted(false);
      } else {
        await archivePost(post.id);
        setCompleted(true);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to toggle request completion:', err);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    const joinAndNavigate =
      ctxBoardId === 'my-posts' && post.tags?.includes('request') && post.questId && roleTag;
    if (joinAndNavigate) {
      const isPrivate = post.visibility === 'private';
      const type = isPrivate ? 'request' : 'free_speech';
      navigate(
        ROUTES.POST(post.id) + `?reply=1&initialType=${type}&intro=1`
      );
      return;
    }
    try {
      setJoining(true);
      if (joined) {
        await unacceptRequest(post.id);
        setJoined(false);
      } else {
        await acceptRequest(post.id);
        setJoined(true);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to join request:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    try {
      if (following) {
        const res = await unfollowPost(post.id);
        setFollowerCount(res.followers.length);
        setFollowing(false);
      } else {
        const res = await followPost(post.id);
        setFollowerCount(res.followers.length);
        setFollowing(true);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to toggle follow', err);
    }
  };

  // no additional effects required when expanding

  return (
    <>
      <div className="flex gap-4 items-center text-sm text-gray-500 dark:text-gray-400 w-full">
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


        {!isQuestRequest && post.type === 'free_speech' && (
          <button
            className={clsx('flex items-center gap-1', userRepostId && 'text-indigo-600')}
            onClick={handleRepost}
            disabled={loading || repostLoading || !user}
          >
            <FaRetweet /> {counts.repost || ''}
          </button>
        )}

        {!isQuestRequest && post.type === 'task' && (
          <button
            className={clsx('flex items-center gap-1', helpRequested && 'text-indigo-600')}
            onClick={handleRequestHelp}
            disabled={loading || !user}
          >
            <FaHandsHelping /> {helpRequested ? 'Cancel Help' : 'Request Help'}
          </button>
        )}

        {isRequestCard && (
          user?.id === post.authorId ? (
            <button
              className={clsx('flex items-center gap-1', completed && 'text-green-600')}
              onClick={handleMarkComplete}
              disabled={!user}
            >
              {completed ? <FaCheckSquare /> : <FaRegCheckSquare />} Complete
            </button>
          ) : !joined ? (
            <button
              className="flex items-center gap-1"
              onClick={handleJoin}
              disabled={joining || !user}
            >
              {joining ? '...' : (
                <>
                  <FaUserPlus />{' '}
                  {post.questId && roleTag ? 'Join' : 'Accept'}
                </>
              )}
            </button>
          ) : (
            <span className="flex items-center gap-1">
              <FaUserCheck /> Joined
            </span>
          )
        )}

        {(post.type === 'task' || post.tags?.includes('request')) && !isRequestCard && !joined && (
          <button className="flex items-center gap-1" onClick={handleFollow} disabled={!user}>
            <FaBell /> {following ? 'Following' : 'Follow'} {followerCount}
          </button>
        )}

        {joined && !isRequestCard && (
          <span className="flex items-center gap-1">
            <FaUserCheck /> Joined
          </span>
        )}

        {post.type === 'task' &&
          !onToggleExpand && (
            <button className="flex items-center gap-1" onClick={() => setInternalExpanded(prev => !prev)}>
              {expanded ? <FaCompress /> : <FaExpand />}{' '}
              {expanded ? 'Collapse View' : 'Expand View'}
            </button>
          )}

        {post.type !== 'task' && !isRequestCard && (
          <button
            className={clsx(
              'flex items-center gap-1',
              showReplyPanel && 'text-green-600'
            )}
            onClick={() => {
              if (replyOverride) {
                replyOverride.onClick();
              } else if (
                post.tags?.includes('request') ||
                isTimelineBoard ||
                isPostBoard
              ) {
                navigate(ROUTES.POST(post.id) + '?reply=1');
              } else {
                setShowReplyPanel(prev => {
                  const next = !prev;
                  onReplyToggle?.(next);
                  return next;
                });
              }
            }}
          >
            <FaReply />{' '}
            {replyOverride
              ? replyOverride.label
              : showReplyPanel
              ? 'Cancel'
              : 'Reply'}
          </button>
        )}

        {timestamp && (
          <span className="ml-auto text-xs text-secondary">{timestamp}</span>
        )}

      </div>

      {showReplyPanel && !replyOverride && !onReplyToggle && (
        <div className="mt-3">
          <CreatePost
            replyTo={post}
            onSave={(newReply) => {
              onUpdate?.(newReply as Post);
              setShowReplyPanel(false);
            }}
            onCancel={() => setShowReplyPanel(false)}
          />
        </div>
      )}


      {expanded && post.type === 'task' && post.questId && (
        <div className="mt-3">
          <TaskCard task={post} questId={post.questId} user={user} onUpdate={onUpdate} />
        </div>
      )}

    </>
  );
};

export default ReactionControls;