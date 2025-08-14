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
  FaHandsHelping,
  FaClipboardCheck,
} from 'react-icons/fa';

import { ROUTES } from '../../constants/routes';
import TaskCard from '../quest/TaskCard';

import { updateReaction, fetchReactions, requestHelp, removeHelpRequest } from '../../api/post';
        
import type {
  Post,
  ReactionType,
  ReactionCountMap,
  Reaction,
} from '../../types/postTypes';
import type { User } from '../../types/userTypes';

type ReplyType = 'free_speech' | 'task' | 'file';


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
  /** Hide the reply button */
  hideReply?: boolean;
}

const INITIAL_COUNTS: ReactionCountMap = { like: 0, heart: 0, repost: 0 };

const ReactionControls: React.FC<ReactionControlsProps> = ({
  post,
  user,
  onUpdate,
  replyOverride,
  timestamp,
  expanded: expandedProp,
  hideReply,
}) => {
  // ---------- UI / local state ----------
  const [reactions, setReactions] = useState<{ like: boolean; heart: boolean; repost: boolean }>({
    like: false,
    heart: false,
    repost: false,
  });
  const [counts, setCounts] = useState<ReactionCountMap>(INITIAL_COUNTS);
  const [loading, setLoading] = useState(true);
  const [helpRequested, setHelpRequested] = useState<boolean>(
    !!post.helpRequest || post.tags?.includes('request') || false
  );
  const [reviewRequested, setReviewRequested] = useState<boolean>(
    post.tags?.includes('review') || false
  );
  const [helpLoading, setHelpLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [showReplyPanel] = useState(false);
  const [, setReplyInitialType] = useState<ReplyType>('free_speech');

  const navigate = useNavigate();

  // ---------- Board context ----------
  const expanded = expandedProp !== undefined ? expandedProp : post.type === 'task';
  const isAuthor = user?.id === post.authorId;

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
        const review = userReactions.some(r => r.type === 'review');
        const request = userReactions.some(r => r.type === 'request');
        setReviewRequested(review || post.tags?.includes('review') || false);
        setHelpRequested(request || !!post.helpRequest || post.tags?.includes('request') || false);
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
      if (!user?.id) {
        navigate(ROUTES.LOGIN);
        return;
      }

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
    [post.id, reactions, user?.id, navigate]
  );

  const handleRequestReview = useCallback(async () => {
    if (!user?.id) {
      navigate(ROUTES.LOGIN);
      return;
    }
    setReviewLoading(true);
    try {
      if (reviewRequested) {
        await removeHelpRequest(post.id, 'file');
        onUpdate?.({
          ...post,
          tags: (post.tags || []).filter(t => t !== 'review' && t !== 'request'),
          helpRequest: false,
        } as Post);
        setReviewRequested(false);
      } else {
        const res = await requestHelp(post.id, 'file');
        onUpdate?.(res.post);
        setReviewRequested(true);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to toggle review request:', err);
    } finally {
      setReviewLoading(false);
    }
  }, [user?.id, navigate, reviewRequested, post.id, post, onUpdate]);

  const handleRequestHelp = useCallback(async () => {
    if (!user?.id) {
      navigate(ROUTES.LOGIN);
      return;
    }
    setHelpLoading(true);
    try {
      if (helpRequested) {
        await removeHelpRequest(post.id, 'task');
        onUpdate?.({
          ...post,
          helpRequest: false,
          tags: (post.tags || []).filter(t => t !== 'request'),
        } as Post);
        setHelpRequested(false);
      } else {
        const res = await requestHelp(post.id, 'task');
        onUpdate?.(res.post);
        setHelpRequested(true);
      }
    } catch (err) {
      console.error('[ReactionControls] Failed to toggle help request:', err);
    } finally {
      setHelpLoading(false);
    }
  }, [user?.id, navigate, helpRequested, post.id, post, onUpdate]);

  const goToReplyPageOrToggle = useCallback(
    (nextType: ReplyType) => {
      if (!user?.id) {
        navigate(ROUTES.LOGIN);
        return;
      }
      setReplyInitialType(nextType);
      if (replyOverride) {
        replyOverride.onClick();
        return;
      }

      navigate(ROUTES.POST(post.id) + '?reply=1');
    },
    [navigate, post.id, replyOverride, user?.id]
  );

  // ---------- Render ----------
  return (
    <>
      <div className="flex w-full items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {/* Like */}
        <button
          className={clsx('flex items-center gap-1', reactions.like && 'text-blue-600')}
          onClick={() => handleToggleReaction('like')}
          disabled={loading}
          aria-label="Like"
        >
          {reactions.like ? <FaThumbsUp /> : <FaRegThumbsUp />} {counts.like || ''}
        </button>

        {/* Heart */}
        <button
          className={clsx('flex items-center gap-1', reactions.heart && 'text-red-500')}
          onClick={() => handleToggleReaction('heart')}
          disabled={loading}
          aria-label="Heart"
        >
          {reactions.heart ? <FaHeart /> : <FaRegHeart />} {counts.heart || ''}
        </button>

        {/* Repost */}
        {['free_speech', 'task', 'file'].includes(post.type) && (
          <button
            aria-label="Repost"
            className={clsx('flex items-center gap-1', reactions.repost && 'text-indigo-600')}
            onClick={() => handleToggleReaction('repost')}
            disabled={loading}
          >
            {reactions.repost ? <FaRetweet /> : <FaRetweet />} {counts.repost || ''}
          </button>
        )}

        {/* Review status for files or reply for non-authors */}
        {post.type === 'file' && (
          isAuthor ? (
            <button
              className={clsx('flex items-center gap-1', reviewRequested && 'text-indigo-600')}
              onClick={handleRequestReview}
              disabled={loading || reviewLoading}
              aria-label={reviewRequested ? 'Requested Review' : 'Request Review'}
            >
              <FaClipboardCheck />
              {reviewRequested ? 'Requested' : 'Request Review'}
            </button>
          ) : (
            !hideReply && (
              <button
                className={clsx('flex items-center gap-1', showReplyPanel && 'text-green-600')}
                onClick={() => goToReplyPageOrToggle('free_speech')}
                aria-label="Reply"
              >
                <FaReply />
                {replyOverride ? replyOverride.label : showReplyPanel ? 'Cancel' : 'Reply'}
              </button>
            )
          )
        )}

        {/* Request status for tasks or reply for non-authors */}
        {post.type === 'task' && (
          isAuthor ? (
            <button
              className={clsx('flex items-center gap-1', helpRequested && 'text-indigo-600')}
              onClick={handleRequestHelp}
              disabled={loading || helpLoading}
              aria-label={helpRequested ? 'Help Requested' : 'Request Help'}
            >
              <FaHandsHelping />
              {helpRequested ? 'Requested' : 'Request Help'}
            </button>
          ) : (
            !hideReply && (
              <button
                className={clsx('flex items-center gap-1', showReplyPanel && 'text-green-600')}
                onClick={() => goToReplyPageOrToggle('free_speech')}
                aria-label="Reply"
              >
                <FaReply />
                {replyOverride ? replyOverride.label : showReplyPanel ? 'Cancel' : 'Reply'}
              </button>
            )
          )
        )}

        {/* Reply / Update */}
        {post.type === 'free_speech' && !hideReply && (
          <button
            className={clsx('flex items-center gap-1', showReplyPanel && 'text-green-600')}
            onClick={() =>
              goToReplyPageOrToggle(
                post.type === 'file' && isAuthor ? 'file' : 'free_speech'
              )
            }
            aria-label={'Reply'}
          >
            <FaReply />
            {replyOverride
              ? replyOverride.label
              : showReplyPanel
              ? 'Cancel'
              : 'Reply'}
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