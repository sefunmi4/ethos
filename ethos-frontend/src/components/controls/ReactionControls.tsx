import React, { useCallback, useEffect, useState } from 'react';
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
} from 'react-icons/fa';

import { useBoardContext } from '../../contexts/BoardContext';
import { ROUTES } from '../../constants/routes';
import TaskCard from '../quest/TaskCard';

import { updateReaction, fetchReactions } from '../../api/post';

import type {
  Post,
  ReactionType,
  ReactionCountMap,
  Reaction,
} from '../../types/postTypes';
import type { User } from '../../types/userTypes';

type ReplyType = 'free_speech' | 'task' | 'change';

type ReviewState = 'review' | 'pending' | 'reviewed';
type RequestState = 'request' | 'pending' | 'complete';

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
  // ---------- UI / local state ----------
  const [reactions, setReactions] = useState<{ like: boolean; heart: boolean; repost: boolean }>({
    like: false,
    heart: false,
    repost: false,
  });
  const [counts, setCounts] = useState<ReactionCountMap>(INITIAL_COUNTS);
  const [loading, setLoading] = useState(true);
  const [reviewState, setReviewState] = useState<ReviewState>('review');
  const [requestState, setRequestState] = useState<RequestState>('request');

  const [showReplyPanel, setShowReplyPanel] = useState(false);
  const [, setReplyInitialType] = useState<ReplyType>('free_speech');

  const navigate = useNavigate();

  // ---------- Board context ----------
  const { selectedBoard, boards } = useBoardContext() || {};
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
        const allReactions = await fetchReactions(post.id);
        if (cancelled) return;

        const countMap: ReactionCountMap = { like: 0, heart: 0, repost: 0 };
        (allReactions as Reaction[]).forEach(({ type }) => {
          if (type === 'like' || type === 'heart' || type === 'repost') countMap[type] += 1;
        });
        setCounts(countMap);

        const userReactions = (allReactions as Reaction[]).filter(r => r.userId === user?.id);
        setReactions({
          like: userReactions.some(r => r.type === 'like'),
          heart: userReactions.some(r => r.type === 'heart'),
          repost: userReactions.some(r => r.type === 'repost'),
        });
        const review = userReactions.find(r => r.type === 'review');
        const request = userReactions.find(r => r.type === 'request');
        setReviewState((review?.state as ReviewState) || 'review');
        setRequestState((request?.state as RequestState) || 'request');
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
  }, [post.id, user?.id]);

  // ---------- Helpers ----------
  const safeBump = (n: number, delta: number) => Math.max(0, n + delta);

  const handleToggleReaction = useCallback(
    async (type: Extract<ReactionType, 'like' | 'heart' | 'repost'>) => {
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
    [post.id, reactions, user?.id]
  );

  const cycleReview = useCallback(async () => {
    if (!user?.id) return;
    const prev = reviewState;
    const next: ReviewState =
      reviewState === 'review'
        ? 'pending'
        : reviewState === 'pending'
        ? 'reviewed'
        : 'review';
    setReviewState(next);
    try {
      if (next === 'review') {
        await updateReaction(post.id, 'review', false);
      } else {
        await updateReaction(post.id, 'review', true, next);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to toggle review:', err);
      setReviewState(prev);
    }
  }, [post.id, reviewState, user?.id]);

  const cycleRequest = useCallback(async () => {
    if (!user?.id) return;
    const prev = requestState;
    const next: RequestState =
      requestState === 'request'
        ? 'pending'
        : requestState === 'pending'
        ? 'complete'
        : 'request';
    setRequestState(next);
    try {
      if (next === 'request') {
        await updateReaction(post.id, 'request', false);
      } else {
        await updateReaction(post.id, 'request', true, next);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to toggle request:', err);
      setRequestState(prev);
    }
  }, [post.id, requestState, user?.id]);

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

        {/* Repost */}
        {['free_speech', 'task', 'change'].includes(post.type) && (
          <button
            aria-label="Repost"
            className={clsx('flex items-center gap-1', reactions.repost && 'text-indigo-600')}
            onClick={() => handleToggleReaction('repost')}
            disabled={loading || !user}
          >
            {reactions.repost ? <FaRetweet /> : <FaRegShareSquare />} {counts.repost || ''}
          </button>
        )}

        {/* Review status for changes */}
        {post.type === 'change' && (
          <button
            className={clsx('flex items-center gap-1', reviewState !== 'review' && 'text-indigo-600')}
            onClick={cycleReview}
            disabled={loading || !user}
            aria-label="Review Status"
          >
            <FaClipboardCheck />
            {reviewState === 'review'
              ? 'Review'
              : reviewState === 'pending'
              ? 'Pending'
              : 'Reviewed'}
          </button>
        )}

        {/* Request status for tasks */}
        {post.type === 'task' && (
          <button
            className={clsx('flex items-center gap-1', requestState !== 'request' && 'text-indigo-600')}
            onClick={cycleRequest}
            disabled={loading || !user}
            aria-label="Request Status"
          >
            <FaHandsHelping />
            {requestState === 'request'
              ? 'Request'
              : requestState === 'pending'
              ? 'Pending'
              : 'Complete'}
          </button>
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