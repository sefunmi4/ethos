import React, { useState, useEffect, useMemo } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { formatDistanceToNow } from 'date-fns';

import type { Post, EnrichedPost } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

import { updatePost } from '../../api/post';
import { fetchQuestById } from '../../api/quest';
import { useGraph } from '../../hooks/useGraph';
import ReactionControls from '../controls/ReactionControls';
import { SummaryTag } from '../ui';
import { useBoardContext } from '../../contexts/BoardContext';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import MediaPreview from '../ui/MediaPreview';
import EditPost from './EditPost';
import ActionMenu from '../ui/ActionMenu';
import GitFileBrowserInline from '../git/GitFileBrowserInline';
import MapGraphLayout from '../layout/MapGraphLayout';
import TeamPanel from '../quest/TeamPanel';
import { buildSummaryTags } from '../../utils/displayUtils';
import { TAG_BASE } from '../../constants/styles';

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
  /** Board ID where this post is being rendered */
  boardId?: string;
  /** Controlled expanded state */
  expanded?: boolean;
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
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showFullDiff, setShowFullDiff] = useState(false);
  const [headPostId, setHeadPostId] = useState<string | null>(null);
  const [internalExpandedView] = useState(post.type === 'task');
  const [activeTab, setActiveTab] = useState<'files' | 'options'>('files');
  const { nodes, edges, loadGraph } = useGraph();

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

  const qid = questId || post.questId;

  useEffect(() => {
    if (expandedView && qid) {
      loadGraph(qid);
    }
  }, [expandedView, qid, loadGraph]);

  const subgraphIds = useMemo(() => {
    const ids = new Set<string>();
    const gather = (id: string) => {
      if (ids.has(id)) return;
      ids.add(id);
      edges.filter((e) => e.from === id).forEach((e) => gather(e.to));
    };
    gather(post.id);
    return ids;
  }, [post.id, edges]);

  const displayNodes = useMemo(
    () => nodes.filter((n) => subgraphIds.has(n.id)),
    [nodes, subgraphIds]
  );
  const displayEdges = useMemo(
    () => edges.filter((e) => subgraphIds.has(e.from) && subgraphIds.has(e.to)),
    [edges, subgraphIds]
  );



  const canEdit = user?.id === post.authorId || post.collaborators?.some(c => c.userId === user?.id);
  const ts = post.timestamp || post.createdAt;
  const timestamp = ts
    ? formatDistanceToNow(new Date(ts), { addSuffix: true })
    : 'Unknown time';

  const content = post.renderedContent || post.content;
  const titleText = post.title || makeHeader(post.content);
  const summaryTags = buildSummaryTags(post, questTitle, questId);
  const isLong = content.length > PREVIEW_LIMIT;
  const allowDelete = !headPostId || post.id !== headPostId;


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



  const renderCommitDiff = () => {
    if (!post.gitDiff) return null;

    const lines = post.gitDiff.split('\n');
    let visibleLines = lines;
    if (!showFullDiff) {
      visibleLines = [];
      let buffer: string[] = [];
      let inChangeBlock = false;

      lines.forEach((line) => {
        if (line.startsWith('+') || line.startsWith('-')) {
          if (!inChangeBlock) {
            if (buffer.length) visibleLines.push('...');
            inChangeBlock = true;
          }
          visibleLines.push(line);
        } else {
          if (inChangeBlock) buffer = [];
          else buffer.push(line);
        }
      });
    }

    return (
      <div className="text-sm bg-background rounded p-2 font-mono border border-secondary">
        {post.commitSummary && (
          <div className="mb-1 text-primary italic">{post.commitSummary}</div>
        )}
        {!showFullDiff && (
          <div className="mb-2">
            <button onClick={() => setShowFullDiff(true)} className="text-accent text-xs underline">
              View full diff
            </button>
          </div>
        )}
        <pre className="overflow-x-auto whitespace-pre-wrap">
          {visibleLines.map((line, idx) => (
            <div key={idx} className={
              line.startsWith('+') ? 'text-success' :
              line.startsWith('-') ? 'text-error' : 'text-primary'}>
              {line}
            </div>
          ))}
        </pre>
        {!showFullDiff && (
          <div className="mt-1">
            <button
              onClick={() => navigate(ROUTES.POST(post.id))}
              className="text-accent text-xs underline"
            >
              View full file with replies
            </button>
          </div>
        )}
      </div>
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

  if (headerOnly) {
    return (
      <div
        id={post.id}
        className={clsx(
          'relative border border-secondary rounded bg-surface shadow-sm p-4 space-y-3 text-primary',
          widthClass,
          depth === 0 ? 'mx-auto' : '',
          post.highlight && 'border-accent bg-infoBackground',
          className
        )}
      >
        <div className="flex justify-between text-sm text-secondary">
          <div className="flex flex-wrap items-center gap-2">
            {summaryTags.map((tag, idx) => (
              <React.Fragment key={idx}>
                <SummaryTag
                  {...tag}
                  className={tag.type === 'quest' ? 'truncate max-w-[8rem]' : undefined}
                />
              </React.Fragment>
            ))}
            {post.tags?.includes('review') && post.rating && renderStars(post.rating)}
          </div>
          <div className="flex items-center gap-2">
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
        <ReactionControls
          post={post}
          user={user}
          onUpdate={onUpdate}
          timestamp={!isQuestBoardRequest ? timestamp : undefined}
          replyOverride={replyOverride}
          boardId={ctxBoardId || undefined}
          expanded={expandedView}
        />
      </div>
    );
  }

  return (
    <div
      id={post.id}
      className={clsx(
        'relative border border-secondary rounded bg-surface shadow-sm p-4 space-y-3 text-primary',
        widthClass,
        depth === 0 ? 'mx-auto' : '',
        post.highlight && 'border-accent bg-infoBackground',
        className
      )}
    >
      <div className="flex justify-between text-sm text-secondary">
        <div className="flex flex-wrap items-center gap-2">
          {summaryTags.map((tag, idx) => (
            <React.Fragment key={idx}>
              <SummaryTag
                {...tag}
                className={tag.type === 'quest' ? 'truncate max-w-[8rem]' : undefined}
              />
            </React.Fragment>
          ))}
          {post.tags?.includes('review') && post.rating && renderStars(post.rating)}
        </div>
        <div className="flex items-center gap-2">
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
              isLong ? (
                <>
                  <div className={compact ? 'clamp-3' : ''}>
                    <MarkdownRenderer
                      content={post.details.slice(0, PREVIEW_LIMIT) + '…'}
                      onToggleTask={handleToggleTask}
                    />
                  </div>
                </>
              ) : (
                <div className={compact ? 'clamp-3' : ''}>
                  <MarkdownRenderer
                    content={post.details}
                    onToggleTask={handleToggleTask}
                  />
                </div>
              )
            )}
          </>
        ) : isLong ? (
          <>
            <div className={compact ? 'clamp-3' : ''}>
              <MarkdownRenderer
                content={content.slice(0, PREVIEW_LIMIT) + '…'}
                onToggleTask={handleToggleTask}
              />
            </div>
          </>
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

      {renderCommitDiff()}




        <div className="mt-4 flex flex-col md:flex-row gap-4" data-testid="task-expanded-view">
          <div className="md:w-1/2">
            <MapGraphLayout items={displayNodes} edges={displayEdges} />
          </div>
          <div className="md:w-1/2">
            <div className="flex border-b text-sm">
              <button
                className={clsx('px-2 py-1', activeTab === 'files' && 'border-b-2 border-accent')}
                onClick={() => setActiveTab('files')}
              >
                Files
              </button>
              <button
                className={clsx('px-2 py-1', activeTab === 'options' && 'border-b-2 border-accent')}
                onClick={() => setActiveTab('options')}
              >
                Options
              </button>
            </div>
            <div className="mt-2">
              {activeTab === 'files' && qid && <GitFileBrowserInline questId={qid} />}
              {activeTab === 'options' && qid && (
                <TeamPanel questId={qid} node={post} canEdit={canEdit} />
              )}
              {!qid && <div className="text-sm text-secondary">No quest linked.</div>}
            </div>
          </div>
        </div>

      <ReactionControls
        post={post}
        user={user}
        onUpdate={onUpdate}
        replyOverride={replyOverride}
        boardId={ctxBoardId || undefined}
        timestamp={!isQuestBoardRequest ? timestamp : undefined}
        expanded={expandedView}
      />
    </div>
  );
};
export default PostCard;
