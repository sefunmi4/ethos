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
} from 'react-icons/fa';
import clsx from 'clsx';
import CreatePost from '../post/CreatePost';
import QuestCard from '../quest/QuestCard';
import TaskCard from '../quest/TaskCard';
import { fetchQuestById } from '../../api/quest';
import {
  updateReaction,
  addRepost,
  removeRepost,
  fetchReactions,
  fetchRepostCount,
  fetchUserRepost,
  updatePost,
  requestHelp,
  acceptRequest,
  unacceptRequest,
  archivePost,
  unarchivePost,
} from '../../api/post';
import type { Post, ReactionType, ReactionCountMap, Reaction } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import type { Quest } from '../../types/questTypes';

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
}) => {
  const [reactions, setReactions] = useState({ like: false, heart: false });
  const [counts, setCounts] = useState({ like: 0, heart: 0, repost: 0 });
  const [loading, setLoading] = useState(true);
  const [userRepostId, setUserRepostId] = useState<string | null>(null);

  const [showReplyPanel, setShowReplyPanel] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showTaskGraph, setShowTaskGraph] = useState(false);
  const [completed, setCompleted] = useState(post.tags?.includes('archived') ?? false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(
    !!user && post.tags?.includes(`pending:${user.id}`)
  );
  const [questData, setQuestData] = useState<Quest | null>(null);
  const navigate = useNavigate();
  const { selectedBoard, appendToBoard } = useBoardContext() || {};
  const ctxBoardId = boardId || selectedBoard;
  const isTimelineBoard = isTimeline ?? ctxBoardId === 'timeline-board';
  const isQuestRequest = ctxBoardId === 'quest-board' && post.type === 'request';
  const isRequestCard =
    post.type === 'request' &&
    ['quest-board', 'timeline-board', 'my-posts'].includes(ctxBoardId || '');
  const [helpRequested, setHelpRequested] = useState(post.helpRequest === true);

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
        appendToBoard?.('quest-board', reqPost);
        appendToBoard?.('timeline-board', reqPost);
        subRequests.forEach(sr => {
          appendToBoard?.('quest-board', sr);
          appendToBoard?.('timeline-board', sr);
          onUpdate?.(sr);
        });
        setHelpRequested(true);
        onUpdate?.(reqPost);
      } catch (err) {
        console.error('[ReactionControls] Failed to request help:', err);
      }
    } else {
      try {
        await updatePost(post.id, { helpRequest: false, needsHelp: false });
        setHelpRequested(false);
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

  useEffect(() => {
    if (expanded && post.type === 'quest' && post.questId && !questData) {
      fetchQuestById(post.questId)
        .then(setQuestData)
        .catch(err => console.error('[ReactionControls] Failed to fetch quest:', err));
    }
  }, [expanded, post.type, post.questId, questData]);

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

        {!isQuestRequest && ['quest', 'task', 'issue'].includes(post.type) && (
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
          ) : (
            <button
              className="flex items-center gap-1"
              onClick={handleJoin}
              disabled={joining || !user}
            >
              {joining ? '...' : joined ? (<><FaUserCheck /> Joined</>) : (<><FaUserPlus /> {post.questId ? 'Join' : 'Apply'}</>)}
            </button>
          )
        )}

        <button
          className={clsx(
            'flex items-center gap-1',
            post.type !== 'task' && post.type !== 'commit' && showReplyPanel && 'text-green-600'
          )}
          onClick={() => {
            if (replyOverride) {
              replyOverride.onClick();
            } else if (post.type === 'commit') {
              navigate(ROUTES.POST(post.id));
            } else if (post.type === 'request') {
              navigate(ROUTES.POST(post.id) + '?reply=1');
            } else if (isTimelineBoard) {
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
            : post.type === 'commit'
            ? 'File Change View'
            : showReplyPanel
            ? 'Cancel'
            : 'Reply'}
        </button>


        {(post.type === 'task' || post.type === 'commit' || post.type === 'quest') && (
          <button
            className="flex items-center gap-1"
            onClick={() => {
              if (post.type === 'task') {
                setShowTaskGraph((p) => !p);
              } else {
                setExpanded((prev) => !prev);
              }
            }}
          >
            {post.type === 'task'
              ? showTaskGraph
                ? <FaCompress />
                : <FaExpand />
              : expanded
              ? <FaCompress />
              : <FaExpand />}{' '}
            {post.type === 'task'
              ? showTaskGraph
                ? 'Collapse View'
                : 'Expand View'
              : expanded
              ? 'Collapse View'
              : 'Expand View'}
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
            onSave={(newReply: Post) => {
              onUpdate?.(newReply);
              setShowReplyPanel(false);
            }}
            onCancel={() => setShowReplyPanel(false)}
          />
        </div>
      )}

      {showTaskGraph && post.type === 'task' && post.questId && (
        <div className="mt-3">
          <TaskCard task={post} questId={post.questId} user={user} />
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

      {expanded && post.type === 'quest' && post.questId && (
        <div className="mt-3">
          {questData ? (
            <QuestCard quest={questData} user={user} defaultExpanded />
          ) : (
            <div className="text-sm">Loading...</div>
          )}
        </div>
      )}
    </>
  );
};

export default ReactionControls;