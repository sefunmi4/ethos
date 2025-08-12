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
  FaClipboardCheck,
  FaUserPlus,
  FaUserCheck,
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
}) => {
  const [reactions, setReactions] = useState({ like: false, heart: false });
  const [counts, setCounts] = useState({ like: 0, heart: 0, repost: 0 });
  const [loading, setLoading] = useState(true);
  const [userRepostId, setUserRepostId] = useState<string | null>(
    post.userRepostId ?? null
  );

  const [showReplyPanel, setShowReplyPanel] = useState(false);
  const [replyInitialType, setReplyInitialType] = useState<'free_speech' | 'task' | 'change'>('free_speech');
  const [repostLoading, setRepostLoading] = useState(false);
  const [helpRequested, setHelpRequested] = useState(post.helpRequest === true);
  const [requestPostId, setRequestPostId] = useState<string | null>(null);

  useEffect(() => {
    setHelpRequested(post.helpRequest === true);
  }, [post.helpRequest]);

  useEffect(() => {
    setUserRepostId(post.userRepostId ?? null);
  }, [post.userRepostId]);

  const isAuthor = !!user && user.id === post.authorId;
  const isTeamMember = !!user && (post.collaborators || []).some(c => c.userId === user.id);
  const isAuthorOrTeam = isAuthor || isTeamMember;
  const initialAccepted = !!user && (
    isAuthorOrTeam || post.tags?.includes(`pending:${user.id}`)
  );
  const [accepted, setAccepted] = useState(initialAccepted);
  const [accepting, setAccepting] = useState(false);

  const navigate = useNavigate();
  const { selectedBoard, appendToBoard, boards, removeItemFromBoard } =
    useBoardContext() || {};
  const ctxBoardId = boardId || selectedBoard;
  const ctxBoardType = ctxBoardId ? boards?.[ctxBoardId]?.boardType : undefined;
  const isTimelineBoard = isTimeline ?? ctxBoardId === 'timeline-board';
  const isPostHistory = ctxBoardId === 'my-posts';
  const isPostBoard = isPostHistory || ctxBoardType === 'post';
  const expanded = expandedProp !== undefined ? expandedProp : post.type === 'task';

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
        setUserRepostId(userRepostRes?.id || post.userRepostId || null);
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
    if (userRepostId) {
      // optimistic update
      setCounts(prev => ({ ...prev, repost: prev.repost - 1 }));
      const prevId = userRepostId;
      setUserRepostId(null);
      try {
        await removeRepost(prevId);
        onUpdate?.({ id: prevId, removed: true });
        onUpdate?.({ ...post, userRepostId: null } as Post);
      } catch (err) {
        // revert on error
        setCounts(prev => ({ ...prev, repost: prev.repost + 1 }));
        setUserRepostId(prevId);
        console.error('[ReactionControls] Failed to toggle repost:', err);
      } finally {
        setRepostLoading(false);
      }
    } else {
      // optimistic update
      setCounts(prev => ({ ...prev, repost: prev.repost + 1 }));
      try {
        const res = await addRepost(post);
        if (res?.id) {
          setUserRepostId(res.id);
          onUpdate?.(res);
          onUpdate?.({ ...post, userRepostId: res.id } as Post);
        } else {
          throw new Error('No repost ID returned');
        }
      } catch (err) {
        // revert on error
        setCounts(prev => ({ ...prev, repost: prev.repost - 1 }));
        setUserRepostId(null);
        console.error('[ReactionControls] Failed to toggle repost:', err);
      } finally {
        setRepostLoading(false);
      }
    }
  };

  const handleRequestHelp = async () => {
    if (!user?.id) return;
    if (!helpRequested) {
      // optimistic update
      setHelpRequested(true);
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
        });
        setRequestPostId(reqPost.id);
        onUpdate?.({ ...post, helpRequest: true, needsHelp: true } as Post);
      } catch (err) {
        // revert on error
        setHelpRequested(false);
        console.error('[ReactionControls] Failed to request help:', err);
      }
    } else {
      // optimistic update
      setHelpRequested(false);
      try {
        await removeHelpRequest(post.id);
        if (requestPostId) {
          removeItemFromBoard?.('quest-board', requestPostId);
          removeItemFromBoard?.('timeline-board', requestPostId);
        }
        setRequestPostId(null);
        onUpdate?.({ ...post, helpRequest: false, needsHelp: false } as Post);
      } catch (err) {
        // revert on error
        setHelpRequested(true);
        console.error('[ReactionControls] Failed to cancel help request:', err);
      }
    }
  };
  const handleAccept = async () => {
    if (!user) return;
    try {
      setAccepting(true);
      if (accepted && !isAuthorOrTeam) {
        await unacceptRequest(post.id);
        setAccepted(false);
      } else {
        const res = await acceptRequest(post.id);
        setAccepted(true);
        onUpdate?.(res.post);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to toggle accept:', err);
    } finally {
      setAccepting(false);
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

        {['free_speech', 'task', 'change'].includes(post.type) && (
          <button
            aria-label="Repost"
            className={clsx('flex items-center gap-1', userRepostId && 'text-indigo-600')}
            onClick={handleRepost}
            disabled={loading || repostLoading || !user}
          >
            <FaRetweet /> {counts.repost || ''}
          </button>
        )}

        {(post.type === 'task' || post.type === 'change') && (
          isAuthorOrTeam ? (
            <button
              className={clsx('flex items-center gap-1', helpRequested && 'text-indigo-600')}
              onClick={handleRequestHelp}
              disabled={loading || !user}
            >
              {post.type === 'task' ? <FaHandsHelping /> : <FaClipboardCheck />}{' '}
              {post.type === 'change'
                ? helpRequested
                  ? 'Review Requested'
                  : 'Review'
                : helpRequested
                  ? 'Requested'
                  : 'Request Help'}
            </button>
          ) : helpRequested ? (
            accepted ? (
              <span className="flex items-center gap-1">
                <FaUserCheck /> Accepted
              </span>
            ) : (
              <button
                className="flex items-center gap-1"
                onClick={handleAccept}
                disabled={accepting || !user}
              >
                {accepting ? '...' : (
                  <>
                    <FaUserPlus />{' '}
                    {post.type === 'change'
                      ? 'Accept Change'
                      : post.questId
                        ? 'Accept Quest'
                        : 'Accept Task'}
                  </>
                )}
              </button>
            )
          ) : null
        )}

        {post.type === 'change' ? (
          <button
            className={clsx(
              'flex items-center gap-1',
              showReplyPanel && 'text-green-600'
            )}
            onClick={() => {
              setReplyInitialType('change');
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
            {showReplyPanel ? 'Cancel' : 'Update'}
          </button>
        ) : (
          <button
            className={clsx(
              'flex items-center gap-1',
              showReplyPanel && 'text-green-600'
            )}
            onClick={() => {
              setReplyInitialType('free_speech');
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
            initialType={replyInitialType}
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