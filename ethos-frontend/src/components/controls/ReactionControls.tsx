import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  FaThumbsUp,
  FaRegThumbsUp,
  FaHeart,
  FaRegHeart,
  FaReply,
  FaRetweet,
  FaRegShareSquare,
  FaHandsHelping,
  FaClipboardCheck,
  FaUserPlus,
  FaUserCheck,
} from 'react-icons/fa';

import { useBoardContext } from '../../contexts/BoardContext';
import { ROUTES } from '../../constants/routes';
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

import type {
  Post,
  ReactionType,
  ReactionCountMap,
  Reaction,
} from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import type { BoardItem } from '../../contexts/BoardContextTypes';

type ReplyType = 'free_speech' | 'task' | 'change';

interface ReactionControlsProps {
  post: Post;
  user?: User;
  onUpdate?: (data: Post | { id: string; removed?: boolean }) => void;
  replyCount?: number; // (unused here but kept for compatibility)
  showReplies?: boolean; // (unused)
  onToggleReplies?: () => void; // (unused)
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

const INITIAL_COUNTS: ReactionCountMap = { like: 0, heart: 0, repost: 0 };

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
  // ---------- Derived user/role state ----------
  const isAuthor = !!user && user.id === post.authorId;
  const isTeamMember = !!user && (post.collaborators ?? []).some(c => c.userId === user.id);
  const isAuthorOrTeam = isAuthor || isTeamMember;

  // ---------- UI / local state ----------
  const [reactions, setReactions] = useState<{ like: boolean; heart: boolean }>({
    like: false,
    heart: false,
  });
  const [counts, setCounts] = useState<ReactionCountMap>(INITIAL_COUNTS);
  const [loading, setLoading] = useState(true);

  const [userRepostId, setUserRepostId] = useState<string | null>(post.userRepostId ?? null);
  const [repostLoading, setRepostLoading] = useState(false);

  const [showReplyPanel, setShowReplyPanel] = useState(false);
  const [replyInitialType, setReplyInitialType] = useState<ReplyType>('free_speech');

  const [helpRequested, setHelpRequested] = useState<boolean>(post.helpRequest === true);
  const [requestPostId, setRequestPostId] = useState<string | null>(null);

  const initialAccepted = useMemo(
    () => !!user && (isAuthorOrTeam || post.tags?.includes(`pending:${user.id}`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, isAuthorOrTeam, (post.tags ?? []).join('|')]
  );
  const [accepted, setAccepted] = useState<boolean>(initialAccepted);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => setHelpRequested(post.helpRequest === true), [post.helpRequest]);
  useEffect(() => setUserRepostId(post.userRepostId ?? null), [post.userRepostId]);
  useEffect(() => setAccepted(initialAccepted), [initialAccepted]);

  const navigate = useNavigate();

  // ---------- Board context ----------
  const boardCtx = useBoardContext();
  const selectedBoard = boardCtx?.selectedBoard;
  const appendToBoard = boardCtx?.appendToBoard;
  const removeItemFromBoard = boardCtx?.removeItemFromBoard;
  const boards = boardCtx?.boards;

  const ctxBoardId = boardId || selectedBoard;
  const ctxBoardType = ctxBoardId ? boards?.[ctxBoardId]?.boardType : undefined;
  const isTimelineBoard = isTimeline ?? ctxBoardId === 'timeline-board';
  const isPostHistory = ctxBoardId === 'my-posts';
  const isPostBoard = isPostHistory || ctxBoardType === 'post';
  const expanded = expandedProp !== undefined ? expandedProp : post.type === 'task';

  // ---------- Fetch reactions on mount/changes ----------
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!post?.id) return;
      setLoading(true);
      try {
        const [allReactions, repostCountRes, userRepostRes] = await Promise.all([
          fetchReactions(post.id),
          fetchRepostCount(post.id),
          user?.id ? fetchUserRepost(post.id) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const userReactions = (allReactions as Reaction[]).filter(r => r.userId === user?.id);
        const countMap: ReactionCountMap = { like: 0, heart: 0, repost: 0 };

        (allReactions as Reaction[]).forEach(({ type }) => {
          if (type === 'like' || type === 'heart') countMap[type] += 1;
        });
        countMap.repost = repostCountRes?.count ?? 0;

        setCounts(countMap);
        setReactions({
          like: userReactions.some(r => r.type === 'like'),
          heart: userReactions.some(r => r.type === 'heart'),
        });
        setUserRepostId(userRepostRes?.id || post.userRepostId || null);
      } catch (err) {
        console.error('[ReactionControls] Failed to fetch data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [post.id, post.userRepostId, user?.id]);

  // ---------- Helpers ----------
  const safeBump = (n: number, delta: number) => Math.max(0, n + delta);

  const handleToggleReaction = useCallback(
    async (type: Extract<ReactionType, 'like' | 'heart'>) => {
      if (!user?.id) return;

      const isActivating = !reactions[type];
      setReactions(prev => ({ ...prev, [type]: isActivating }));
      setCounts(prev => ({ ...prev, [type]: safeBump(prev[type], isActivating ? 1 : -1) }));

      try {
        await updateReaction(post.id, type, isActivating);
      } catch (err) {
        console.error(`[ReactionControls] Failed to toggle ${type}:`, err);
        // revert
        setReactions(prev => ({ ...prev, [type]: !isActivating }));
        setCounts(prev => ({ ...prev, [type]: safeBump(prev[type], isActivating ? -1 : 1) }));
      }
    },
    [post.id, reactions.like, reactions.heart, user?.id]
  );

  const handleRepost = useCallback(async () => {
    if (!user?.id || repostLoading) return;
    setRepostLoading(true);

    const wasReposted = !!userRepostId;

    if (wasReposted) {
      // optimistic remove
      setCounts(prev => ({ ...prev, repost: safeBump(prev.repost, -1) }));
      const prevId = userRepostId!;
      setUserRepostId(null);
      try {
        await removeRepost(prevId);
        onUpdate?.({ id: prevId, removed: true });
        onUpdate?.({ ...post, userRepostId: null } as Post);
      } catch (err) {
        // revert
        console.error('[ReactionControls] Failed to toggle repost:', err);
        setCounts(prev => ({ ...prev, repost: safeBump(prev.repost, +1) }));
        setUserRepostId(prevId);
      } finally {
        setRepostLoading(false);
      }
      return;
    }

    // optimistic add
    setCounts(prev => ({ ...prev, repost: safeBump(prev.repost, +1) }));
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
      console.error('[ReactionControls] Failed to toggle repost:', err);
      setCounts(prev => ({ ...prev, repost: safeBump(prev.repost, -1) }));
      setUserRepostId(null);
    } finally {
      setRepostLoading(false);
    }
  }, [onUpdate, post, repostLoading, user?.id, userRepostId]);

  const handleRequestHelp = useCallback(async () => {
    if (!user?.id) return;

    // Requesting help
    if (!helpRequested) {
      setHelpRequested(true); // optimistic
      try {
        const { request: reqPost, subRequests } = await requestHelp(post.id, post.type);
        // Fan-out to boards
        appendToBoard?.('quest-board', reqPost as unknown as BoardItem);
        appendToBoard?.('timeline-board', reqPost as unknown as BoardItem);
        (subRequests ?? []).forEach(sr => {
          appendToBoard?.('quest-board', sr as unknown as BoardItem);
          appendToBoard?.('timeline-board', sr as unknown as BoardItem);
        });
        setRequestPostId(reqPost.id);
        onUpdate?.({ ...post, helpRequest: true, needsHelp: true } as Post);
      } catch (err) {
        console.error('[ReactionControls] Failed to request help:', err);
        setHelpRequested(false); // revert
      }
      return;
    }

    // Cancel help request
    setHelpRequested(false); // optimistic
    try {
      await removeHelpRequest(post.id);
      if (requestPostId) {
        removeItemFromBoard?.('quest-board', requestPostId);
        removeItemFromBoard?.('timeline-board', requestPostId);
      }
      setRequestPostId(null);
      onUpdate?.({ ...post, helpRequest: false, needsHelp: false } as Post);
    } catch (err) {
      console.error('[ReactionControls] Failed to cancel help request:', err);
      setHelpRequested(true); // revert
    }
  }, [
    appendToBoard,
    onUpdate,
    post,
    removeItemFromBoard,
    requestPostId,
    user?.id,
    helpRequested,
  ]);

  const handleAccept = useCallback(async () => {
    if (!user) return;
    setAccepting(true);
    try {
      if (accepted && !isAuthorOrTeam) {
        await unacceptRequest(post.id);
        setAccepted(false);
      } else {
        const res = await acceptRequest(post.id);
        setAccepted(true);
        if (res?.post) onUpdate?.(res.post);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to toggle accept:', err);
    } finally {
      setAccepting(false);
    }
  }, [accepted, isAuthorOrTeam, onUpdate, post.id, user]);

  const goToReplyPageOrToggle = useCallback(
    (nextType: ReplyType) => {
      setReplyInitialType(nextType);
      if (replyOverride) {
        replyOverride.onClick();
        return;
      }

      const shouldNavigate = post.tags?.includes('request') || isTimelineBoard || isPostBoard;
      if (shouldNavigate) {
        navigate(ROUTES.POST(post.id) + '?reply=1');
        return;
      }

      setShowReplyPanel(prev => {
        const next = !prev;
        onReplyToggle?.(next);
        return next;
      });
    },
    [isPostBoard, isTimelineBoard, navigate, onReplyToggle, post.id, post.tags, replyOverride]
  );

  // ---------- Render ----------
  return (
    <>
      <div className="flex w-full items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {/* Like */}
        <button
          className={clsx('flex items-center gap-1', reactions.like && 'text-blue-600')}
          onClick={() => handleToggleReaction('like')}
          disabled={loading || !user}
          aria-label="Like"
        >
          {reactions.like ? <FaThumbsUp /> : <FaRegThumbsUp />} {counts.like || ''}
        </button>

        {/* Heart */}
        <button
          className={clsx('flex items-center gap-1', reactions.heart && 'text-red-500')}
          onClick={() => handleToggleReaction('heart')}
          disabled={loading || !user}
          aria-label="Heart"
        >
          {reactions.heart ? <FaHeart /> : <FaRegHeart />} {counts.heart || ''}
        </button>

        {/* Repost (only for certain post types) */}
        {['free_speech', 'task', 'change'].includes(post.type) && (
          <button
            aria-label="Repost"
            className={clsx('flex items-center gap-1', userRepostId && 'text-indigo-600')}
            onClick={handleRepost}
            disabled={loading || repostLoading || !user}
          >
            {userRepostId ? <FaRetweet /> : <FaRegShareSquare />} {counts.repost || ''}
          </button>
        )}

        {/* Help / Review / Accept */}
        {(post.type === 'task' || post.type === 'change') && (
          isAuthorOrTeam ? (
            <button
              className={clsx('flex items-center gap-1', helpRequested && 'text-indigo-600')}
              onClick={handleRequestHelp}
              disabled={loading || !user}
              aria-label={post.type === 'change' ? 'Request Review' : 'Request Help'}
            >
              {post.type === 'task' ? <FaHandsHelping /> : <FaClipboardCheck />}
              {post.type === 'change'
                ? (helpRequested ? 'Requested' : 'Review')
                : (helpRequested ? 'Requested' : 'Request')}
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
                aria-label="Accept Request"
              >
                {accepting ? '...' : (
                  <>
                    <FaUserPlus />
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

        {/* Reply / Update */}
        {post.type === 'change' ? (
          <button
            className={clsx('flex items-center gap-1', showReplyPanel && 'text-green-600')}
            onClick={() => goToReplyPageOrToggle('change')}
            aria-label="Update"
          >
            <FaReply /> {showReplyPanel ? 'Cancel' : 'Update'}
          </button>
        ) : (
          <button
            className={clsx('flex items-center gap-1', showReplyPanel && 'text-green-600')}
            onClick={() => goToReplyPageOrToggle('free_speech')}
            aria-label="Reply"
          >
            <FaReply />
            {replyOverride ? replyOverride.label : (showReplyPanel ? 'Cancel' : 'Reply')}
          </button>
        )}

        {/* Timestamp */}
        {timestamp && (
          <span className="ml-auto text-xs text-secondary">{timestamp}</span>
        )}
      </div>

      {/* Inline task details */}
      {expanded && post.type === 'task' && post.questId && (
        <div className="mt-3">
          <TaskCard task={post} questId={post.questId} user={user} onUpdate={onUpdate} />
        </div>
      )}
    </>
  );
};

export default ReactionControls;