import React, { useState, useEffect, useCallback } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { formatDistanceToNow } from 'date-fns';

import type { Post, EnrichedPost } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

import { updatePost, removeHelpRequest } from '../../api/post';
import { fetchQuestById } from '../../api/quest';
import ReactionControls from '../controls/ReactionControls';
import { SummaryTag, Button } from '../ui';
import { useBoardContext } from '../../contexts/BoardContext';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import MediaPreview from '../ui/MediaPreview';
import EditPost from './EditPost';
import ActionMenu from '../ui/ActionMenu';
import { buildSummaryTags, type SummaryTagData } from '../../utils/displayUtils';
import { TAG_BASE } from '../../constants/styles';
import { useGraph } from '../../hooks/useGraph';

const PREVIEW_LIMIT = 240;
const makeHeader = (content: string): string => {
  const text = content.trim();
  // TODO: replace with AI-generated summaries
  return text.length <= 50 ? text : text.slice(0, 50) + '…';
};

const renderStars = (count: number) => (
  <span aria-label={`Rating: ${count}`} className="text-yellow-500 flex">
    {[1, 2, 3, 4, 5].map((n) => {
      const full = count >= n;
      const half = !full && count >= n - 0.5;
      return (
        <span key={n} className="mr-0.5">
          {full ? <FaStar /> : half ? <FaStarHalfAlt /> : <FaRegStar />}
        </span>
      );
    })}
  </span>
);

type PostWithExtras = Post & Partial<EnrichedPost>;

interface PostCardProps {
  post: PostWithExtras;
  user?: User;
  onUpdate?: (post: Post | { id: string; removed?: boolean }) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  questId?: string;
  questTitle?: string;
  /** Show status dropdown controls for task posts */
  showStatusControl?: boolean;
  replyOverride?: { label: string; onClick: () => void };
  /** Render only the post header and reaction controls */
  headerOnly?: boolean;
  /** Nesting depth for replies */
  depth?: number;
  /** Additional classes for outer wrapper */
  className?: string;
  /** Expand replies when first rendered */
  initialShowReplies?: boolean;
  /** Show detailed view including reply chain */
  showDetails?: boolean;
  /** Callback when expansion toggled */
  onToggleExpand?: () => void;
  /** Board ID where this post is being rendered */
  boardId?: string;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Hide reply reaction button */
  hideReplyButton?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  user,
  onUpdate,
  onDelete,
  compact = false,
  questId,
  questTitle,
  replyOverride,
  headerOnly = false,
  depth = 0,
  className = '',
  boardId,
  expanded,
  showDetails = false,
  onToggleExpand,
  hideReplyButton,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [headPostId, setHeadPostId] = useState<string | null>(null);
  const [internalExpandedView, setInternalExpandedView] = useState(
    post.type === 'task' || showDetails
  );
  const { loadGraph } = useGraph();

  const navigate = useNavigate();
  const { selectedBoard } = useBoardContext() || {};

  const dispatchTaskUpdated = (p: Post) => {
    if (p.type === 'task') {
      document.dispatchEvent(
        new CustomEvent('taskUpdated', {
          detail: { task: p },
          bubbles: true,
        })
      );
    }
  };

  const ctxBoardId = boardId || selectedBoard;

  const isQuestBoardRequest =
    post.tags?.includes('request') && ctxBoardId === 'quest-board';

  const widthClass =
    ctxBoardId === 'timeline-board' || ctxBoardId === 'my-posts'
      ? 'max-w-3xl'
      : isQuestBoardRequest
        ? 'w-72'
        : 'max-w-prose';

  const expandedView = expanded ?? internalExpandedView;
  const cardClasses = clsx(
    'relative border border-secondary rounded bg-surface shadow-sm p-4 space-y-3 text-primary',
    widthClass,
    depth === 0 ? 'mx-auto' : '',
    post.highlight && 'border-accent bg-infoBackground',
    className,
  );

  const qid = questId || post.questId;
  const isAuthor = user?.id === post.authorId;
  const initialJoinState = post.collaborators?.some(c => c.userId === user?.id)
    ? 'MEMBER'
    : post.collaborators?.some(c => c.pending?.includes(user?.id || ''))
      ? 'PENDING'
      : 'NONE';
  const [joinState, setJoinState] = useState<'NONE' | 'PENDING' | 'MEMBER'>(initialJoinState);

  const handleRequestJoin = () => {
    navigate(ROUTES.POST(post.id) + '?reply=1&intro=1');
    setJoinState('PENDING');
  };

  const handleSendReview = () => {
    navigate(ROUTES.POST(post.id) + '?reply=1&initialType=review');
  };

  useEffect(() => {
    if (expandedView && qid) {
      loadGraph(qid);
    }
  }, [expandedView, qid, loadGraph]);
  const canEdit = isAuthor || post.collaborators?.some(c => c.userId === user?.id);
  const ts = post.timestamp || post.createdAt;
  const timestamp = ts
    ? formatDistanceToNow(new Date(ts), { addSuffix: true })
    : 'Unknown time';

  const content = post.renderedContent || post.content;
  const titleText = post.title || makeHeader(post.content);
  const [summaryTags, setSummaryTags] = useState<SummaryTagData[]>([]);
  useEffect(() => {
    let active = true;
    buildSummaryTags(post, questTitle, questId).then(tags => {
      if (active) setSummaryTags(tags);
    });
    return () => {
      active = false;
    };
  }, [post, questTitle, questId]);
  const isLong =
    (post.type === 'task' ? post.details || '' : content).length > PREVIEW_LIMIT;
  const allowDelete = !headPostId || post.id !== headPostId;

  const handleCancelRequest = useCallback(async () => {
    try {
      await removeHelpRequest(post.id, post.type);
      onUpdate?.({
        ...post,
        userRepostId: null,
        helpRequest: false,
        tags: (post.tags || []).filter(t => t !== (post.type === 'file' ? 'review' : 'request')),
      } as Post);
    } catch (err) {
      console.error('[PostCard] Failed to cancel help request:', err);
    }
  }, [onUpdate, post]);

  const renderHeader = () => (
    <div className="flex justify-between text-sm text-secondary">
      <div className="flex flex-wrap items-center gap-2">
        {summaryTags.map((tag, idx) => (
          <React.Fragment key={idx}>
            <SummaryTag
              {...tag}
              className={tag.type === 'quest' ? 'truncate max-w-[8rem]' : undefined}
              onClick={['request', 'review'].includes(tag.type) ? handleCancelRequest : undefined}
            />
          </React.Fragment>
        ))}
        {post.tags?.includes('review') && post.rating && renderStars(post.rating)}
      </div>
      <div className="flex items-center gap-2">
        {(onToggleExpand || headerOnly || isLong) && (
          <button
            onClick={() =>
              onToggleExpand ? onToggleExpand() : setInternalExpandedView(v => !v)
            }
            className="flex items-center gap-1 text-xs text-secondary"
          >
            {expandedView ? (
              <>
                <FaChevronUp />
              </>
            ) : (
              <>
                <FaChevronDown />
              </>
            )}
          </button>
        )}
        <ActionMenu
          id={post.id}
          type="post"
          canEdit={canEdit}
          onEdit={() => setEditMode(true)}
          onDelete={() => onDelete?.(post.id)}
          allowDelete={allowDelete}
          content={post.content}
          permalink={`${window.location.origin}${ROUTES.POST(post.id)}`}
        />
      </div>
    </div>
  );


  useEffect(() => {
    const qid = questId || post.questId;
    if (!qid) return;
    fetchQuestById(qid)
      .then((q) => setHeadPostId(q.headPostId))
      .catch(() => {});
  }, [questId, post.questId]);

  const handleToggleTask = async (index: number, checked: boolean) => {
    const regex = /- \[[ xX]\]/g;
    let i = -1;
    const updatedContent = post.content.replace(regex, match => {
      i += 1;
      if (i === index) return `- [${checked ? 'x' : ' '}]`;
      return match;
    });

    const optimistic = { ...post, content: updatedContent } as Post;
    onUpdate?.(optimistic);
    dispatchTaskUpdated(optimistic);
    try {
      const updated = await updatePost(post.id, { content: updatedContent });
      onUpdate?.(updated);
      dispatchTaskUpdated(updated);
    } catch (err) {
      console.error('[PostCard] Failed to toggle task:', err);
    }
  };

  const renderRepostInfo = () => {
    const quote = post.repostedFrom;
    if (!quote?.originalContent) return null;
    return (
      <blockquote className="border-l-4 pl-4 text-secondary italic bg-background rounded">
        “{quote.originalContent.length > 180 ? quote.originalContent.slice(0, 180) + '…' : quote.originalContent}”
        <div className="text-xs mt-1 text-secondary">
          — @{quote.username || 'unknown'}
        </div>
      </blockquote>
    );
  };

  const renderControls = () => {
    if (post.type === 'request' && isAuthor) {
      return (
        <div className="text-sm text-secondary">
          Collaborators: {post.collaborators?.length || 0}
        </div>
      );
    }

    return (
      <>
        {post.type === 'request' && !isAuthor && (
          <Button
            variant="contrast"
            className="mb-2"
            onClick={handleRequestJoin}
            disabled={joinState !== 'NONE'}
            title={joinState !== 'NONE' ? 'Request pending approval' : undefined}
          >
            {joinState === 'PENDING' ? 'Pending' : 'Request to Join'}
          </Button>
        )}
        {post.type === 'review' && !isAuthor && (
          <Button
            variant="contrast"
            className="mb-2"
            onClick={handleSendReview}
          >
            Send Review
          </Button>
        )}
        <ReactionControls
          post={post}
          user={user}
          onUpdate={onUpdate}
          replyOverride={replyOverride}
          boardId={ctxBoardId || undefined}
          timestamp={!isQuestBoardRequest ? timestamp : undefined}
          expanded={expandedView}
          hideReply={hideReplyButton}
        />
      </>
    );
  };


  if (editMode) {
    return (
      <EditPost
        post={post}
        onCancel={() => setEditMode(false)}
        onUpdated={(p) => {
          onUpdate?.(p);
          setEditMode(false);
        }}
      />
    );
  }

  if (headerOnly && !expandedView) {
    return (
      <div id={post.id} className={cardClasses}>
        {renderHeader()}
        {isQuestBoardRequest && timestamp && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {timestamp}
          </div>
        )}
        {titleText && (
          <h3
            className="font-semibold text-lg mt-1 cursor-pointer truncate"
            onClick={() => navigate(ROUTES.POST(post.id))}
          >
            {titleText}
          </h3>
        )}
        {renderControls()}
      </div>
    );
  }

  return (
    <div id={post.id} className={cardClasses}>
      {renderHeader()}
      {isQuestBoardRequest && timestamp && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {timestamp}
        </div>
      )}

      {renderRepostInfo()}

      {titleText && (
        <h3 className="font-semibold text-lg mt-1 truncate">{titleText}</h3>
      )}

      <div className="text-sm text-primary">
        {post.type === 'task' ? (
          <>
            <div
              className="font-semibold cursor-pointer"
              onClick={() => {
                if (questId) {
                  window.dispatchEvent(
                    new CustomEvent('questTaskOpen', { detail: { taskId: post.id } })
                  );
                } else {
                  navigate(ROUTES.POST(post.id));
                }
              }}
            >
              {post.content}
            </div>
            {post.details && (
              <div className={compact ? 'clamp-3' : ''}>
                <MarkdownRenderer
                  content={
                    isLong && !expandedView
                      ? post.details.slice(0, PREVIEW_LIMIT) + '…'
                      : post.details
                  }
                  onToggleTask={handleToggleTask}
                />
              </div>
            )}
          </>
        ) : isLong && !expandedView ? (
          <div className={compact ? 'clamp-3' : ''}>
            <MarkdownRenderer
              content={content.slice(0, PREVIEW_LIMIT) + '…'}
              onToggleTask={handleToggleTask}
            />
          </div>
        ) : (
          <div className={compact ? 'clamp-3' : ''}>
            <MarkdownRenderer content={content} onToggleTask={handleToggleTask} />
          </div>
        )}
        <MediaPreview media={post.mediaPreviews} />
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Array.from(new Set(post.tags)).map((tag) => (
              <span key={tag} className={TAG_BASE}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {renderControls()}
    </div>
  );
};
export default PostCard;
