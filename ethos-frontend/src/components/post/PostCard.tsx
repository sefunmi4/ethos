import React, { useState, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar, FaExpand, FaCompress } from 'react-icons/fa';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { formatDistanceToNow } from 'date-fns';

import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

import { fetchRepliesByPostId, updatePost, fetchPostsByQuestId, acceptRequest, unacceptRequest } from '../../api/post';
import { linkPostToQuest, fetchQuestById } from '../../api/quest';
import { useGraph } from '../../hooks/useGraph';
import ReactionControls from '../controls/ReactionControls';
import CreatePost from './CreatePost';
import { Spinner, Select, SummaryTag } from '../ui';
import { STATUS_OPTIONS } from '../../constants/options';
import { useBoardContext } from '../../contexts/BoardContext';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import MediaPreview from '../ui/MediaPreview';
import LinkViewer from '../ui/LinkViewer';
import LinkControls from '../controls/LinkControls';
import EditPost from './EditPost';
import ActionMenu from '../ui/ActionMenu';
import GitFileBrowserInline from '../git/GitFileBrowserInline';
import NestedReply from './NestedReply';
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

interface PostCardProps {
  post: Post;
  user?: User;
  onUpdate?: (post: Post) => void;
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
  /** Callback when expand toggled */
  onToggleExpand?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  user,
  onUpdate,
  onDelete,
  compact = false,
  questId,
  questTitle,
  showStatusControl = true,
  replyOverride,
  headerOnly = false,
  depth = 0,
  className = '',
  initialShowReplies = false,
  showDetails = false,
  boardId,
  expanded,
  onToggleExpand,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [replies, setReplies] = useState<Post[]>([]);
  const [showReplies, setShowReplies] = useState(initialShowReplies);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [showFullDiff, setShowFullDiff] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [linkDraft, setLinkDraft] = useState(post.linkedItems || []);
  const [initialReplies, setInitialReplies] = useState<number>(0);
  const [parentId, setParentId] = useState('');
  const [edgeType, setEdgeType] = useState<'sub_problem' | 'solution_branch' | 'folder_split' | 'abstract'>('sub_problem');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [questPosts, setQuestPosts] = useState<Post[]>([]);
  const [createType, setCreateType] = useState<'log' | 'issue' | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [asCommit, setAsCommit] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [headPostId, setHeadPostId] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [linkExpanded, setLinkExpanded] = useState(false);
  const [internalExpandedView, setInternalExpandedView] = useState(false);
  const { loadGraph } = useGraph();

  const navigate = useNavigate();
  const {
    selectedBoard,
    updateBoardItem,
    appendToBoard,
  } = useBoardContext() || {};

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
    post.type === 'request' && ctxBoardId === 'quest-board';
  const isTimelineRequest = post.type === 'request' && ctxBoardId === 'timeline-board';

  const widthClass =
    ctxBoardId === 'timeline-board' || ctxBoardId === 'my-posts'
      ? 'max-w-3xl'
      : isQuestBoardRequest
        ? 'max-w-2xl'
        : 'max-w-prose';

  const expandedView = expanded !== undefined ? expanded : internalExpandedView;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const optimistic = { ...post, status: newStatus };
    if (ctxBoardId) updateBoardItem(ctxBoardId, optimistic);
    onUpdate?.(optimistic);
    dispatchTaskUpdated(optimistic);
    try {
      const updated = await updatePost(post.id, { status: newStatus });
      if (ctxBoardId) updateBoardItem(ctxBoardId, updated);
      onUpdate?.(updated);
      dispatchTaskUpdated(updated);
    } catch (err) {
      console.error('[PostCard] Failed to update status:', err);
    }
  };

  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(
    !!user && post.tags?.includes(`pending:${user.id}`)
  );


  const handleAccept = async () => {
    try {
      setAccepting(true);
      if (accepted) {
        await unacceptRequest(post.id);
        setAccepted(false);
      } else {
        await acceptRequest(post.id);
        setAccepted(true);
      }
    } catch (err) {
      console.error('[PostCard] Failed to accept request:', err);
    } finally {
      setAccepting(false);
    }
  };


  const canEdit = user?.id === post.authorId || post.collaborators?.some(c => c.userId === user?.id);
  const ts = post.timestamp || post.createdAt;
  const timestamp = ts
    ? formatDistanceToNow(new Date(ts), { addSuffix: true })
    : 'Unknown time';

  const content = post.renderedContent || post.content;
  const titleText = post.title || makeHeader(post.content);
  let summaryTags = buildSummaryTags(post, questTitle, questId);
  if (isQuestBoardRequest) {
    const user = post.author?.username || post.authorId;
    summaryTags = [
      {
        type: 'request',
        label: 'Request:',
        detailLink: ROUTES.POST(post.id),
        username: user,
        usernameLink: ROUTES.PUBLIC_PROFILE(post.authorId),
      },
    ];
  }
  const isLong = content.length > PREVIEW_LIMIT;
  const allowDelete = !headPostId || post.id !== headPostId;

  useEffect(() => {
    if (!post.replyTo) {
      fetchRepliesByPostId(post.id)
        .then((r) => setInitialReplies(r.length))
        .catch(() => {});
    }
  }, [post.id, post.replyTo]);

  useEffect(() => {
    if (initialShowReplies && !repliesLoaded) {
      setShowReplies(true);
      setLoadingReplies(true);
      setReplyError('');
      fetchRepliesByPostId(post.id)
        .then((res) => {
          setReplies(res || []);
          setRepliesLoaded(true);
        })
        .catch((err) => {
          console.error(`[PostCard] Load replies failed:`, err);
          setReplyError('Could not load replies.');
        })
        .finally(() => setLoadingReplies(false));
    }
  }, [initialShowReplies, post.id, repliesLoaded]);

  useEffect(() => {
    const qid = questId || post.questId;
    if (showLinkEditor && qid) {
      fetchPostsByQuestId(qid)
        .then(setQuestPosts)
        .catch((err) =>
          console.error('[PostCard] Failed to fetch quest posts:', err)
        );
    }
  }, [showLinkEditor, questId, post.questId]);

  useEffect(() => {
    const qid = questId || post.questId;
    if (!qid) return;
    fetchQuestById(qid)
      .then((q) => setHeadPostId(q.headPostId))
      .catch(() => {});
  }, [questId, post.questId]);
  const toggleReplies = async () => {
    if (!repliesLoaded) {
      setLoadingReplies(true);
      setReplyError('');
      try {
        const res = await fetchRepliesByPostId(post.id);
        setReplies(res || []);
        setRepliesLoaded(true);
      } catch (err) {
        console.error(`[PostCard] Load replies failed:`, err);
        setReplyError('Could not load replies.');
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(prev => !prev);
  };

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

  const renderLinkSummary = () => {
    if (
      post.type === 'request' ||
      (!showDetails && (!post.linkedItems || post.linkedItems.length === 0))
    ) {
      return null;
    }
    return (
      <LinkViewer
        items={post.linkedItems || []}
        post={post}
        showReplyChain={showDetails}
        open={linkExpanded}
        onToggle={() => setLinkExpanded(o => !o)}
      />
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
            {post.type === 'review' && post.rating && renderStars(post.rating)}
          </div>
          <div className="flex items-center gap-2">
            {['task', 'quest'].includes(post.type) && (
              <button
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"
                onClick={() =>
                  onToggleExpand ? onToggleExpand() : setInternalExpandedView(prev => !prev)
                }
              >
                {expandedView ? <FaCompress /> : <FaExpand />}{' '}
                {expandedView ? 'Collapse View' : 'Expand View'}
              </button>
            )}
            <ActionMenu
              id={post.id}
              type="post"
              canEdit={canEdit}
              onEdit={() => setEditMode(true)}
              onEditLinks={() => setShowLinkEditor(true)}
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
          onToggleExpand={() =>
            onToggleExpand ? onToggleExpand() : setInternalExpandedView(prev => !prev)
          }
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
          {post.type === 'review' && post.rating && renderStars(post.rating)}
          {!isQuestBoardRequest &&
            canEdit &&
            ['task', 'request', 'issue'].includes(post.type) &&
            showStatusControl && (
            <div className="ml-1 w-28">
              <Select
                value={post.status || 'To Do'}
                onChange={handleStatusChange}
                options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {['task', 'quest'].includes(post.type) && (
            <button
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"
              onClick={() =>
                onToggleExpand ? onToggleExpand() : setInternalExpandedView(prev => !prev)
              }
            >
              {expandedView ? <FaCompress /> : <FaExpand />}{' '}
              {expandedView ? 'Collapse View' : 'Expand View'}
            </button>
          )}
          <ActionMenu
            id={post.id}
            type="post"
            canEdit={canEdit}
            onEdit={() => setEditMode(true)}
            onEditLinks={() => setShowLinkEditor(true)}
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

      {post.linkedNodeId && post.author?.username && !isQuestBoardRequest && (
        <div className="text-xs text-secondary italic">
          @{post.author.username} committed changes to <strong>{post.linkedNodeId}</strong> {timestamp}
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
                  <button
                    onClick={() => navigate(ROUTES.POST(post.id))}
                    className="text-accent underline text-xs ml-1"
                  >
                    See more
                  </button>
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
            <button
              onClick={() => navigate(ROUTES.POST(post.id))}
              className="text-accent underline text-xs ml-1"
            >
              See more
            </button>
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

      <ReactionControls
        post={post}
        user={user}
        onUpdate={onUpdate}
        replyOverride={replyOverride}
        boardId={ctxBoardId || undefined}
        timestamp={!isQuestBoardRequest ? timestamp : undefined}
        expanded={expandedView}
        onToggleExpand={() =>
          onToggleExpand ? onToggleExpand() : setInternalExpandedView(prev => !prev)
        }
        onReplyToggle={
          post.linkedItems && post.linkedItems.length > 0 ? setShowReplyForm : undefined
        }
      />

      {renderLinkSummary()}

      {showReplyForm && (
        <div className="mt-2">
          <CreatePost
            replyTo={post}
            onSave={(r) => {
              onUpdate?.(r);
              setShowReplyForm(false);
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {['request','quest','task','log','commit','issue', 'meta_system'].includes(post.type) && (
        <div className="text-xs text-secondary space-y-1">
          {showLinkEditor && (
            <div className="mt-2">
              <LinkControls
                value={linkDraft}
                onChange={setLinkDraft}
                allowCreateNew={false}
                itemTypes={['quest', 'post']}
              />
              {linkDraft.some(l => l.linkType === 'task_edge') && (questId || post.questId) && (
                <div className="mt-2 space-y-1">
                  <label className="text-xs text-secondary">Parent Post</label>
                  <select
                    className="border rounded px-1 py-0.5 text-xs w-full"
                    value={parentId}
                    onChange={e => setParentId(e.target.value)}
                  >
                    <option value="">-- select parent --</option>
                    {questPosts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.content.slice(0, 30)}
                      </option>
                    ))}
                  </select>
                  <label className="text-xs text-secondary">Edge Type</label>
                  <select
                    className="border rounded px-1 py-0.5 text-xs w-full"
                    value={edgeType}
                    onChange={e =>
                      setEdgeType(
                        e.target.value as 'sub_problem' | 'solution_branch' | 'folder_split' | 'abstract'
                      )
                    }
                  >
                    <option value="sub_problem">sub_problem</option>
                    <option value="solution_branch">solution_branch</option>
                    <option value="folder_split">folder_split</option>
                    <option value="abstract">abstract</option>
                  </select>
                  <label className="text-xs text-secondary">Edge Label</label>
                  <input
                    type="text"
                    className="border rounded px-1 py-0.5 text-xs w-full"
                    value={edgeLabel}
                    onChange={e => setEdgeLabel(e.target.value)}
                  />
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
                  onClick={async () => {
                    try {
                      const updated = await updatePost(post.id, { linkedItems: linkDraft });
                      if (linkDraft.some(l => l.linkType === 'task_edge') && (questId || post.questId)) {
                        await linkPostToQuest(questId || post.questId!, {
                          postId: post.id,
                          parentId: parentId || undefined,
                          edgeType,
                          edgeLabel: edgeLabel || undefined,
                          title: post.questNodeTitle || makeHeader(post.content),
                        });
                        loadGraph(questId || post.questId!);
                      }
                      setShowLinkEditor(false);
                      onUpdate?.(updated);
                      dispatchTaskUpdated(updated);
                    } catch (err) {
                      console.error('[PostCard] Failed to update links:', err);
                    }
                  }}
                >
                  Save
                </button>
                <button
                  className="text-xs underline"
                  onClick={() => {
                    setLinkDraft(post.linkedItems || []);
                    setShowLinkEditor(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {post.questId && post.nodeId && (
            <div>🧭 Linked to Quest: {post.nodeId}</div>
          )}
        </div>
      )}


      {post.type === 'task' && post.linkedNodeId && post.questId && (
        <>
          <button
            onClick={() => setShowBrowser(true)}
            className="text-accent underline text-xs mt-1"
          >
            View {post.taskType === 'file' ? 'File' : post.taskType === 'folder' ? 'Folder' : 'Planner'}
          </button>
          {showBrowser && (
            <div className="mt-2">
              <GitFileBrowserInline
                questId={post.questId}
                onClose={() => setShowBrowser(false)}
              />
            </div>
          )}
        </>
      )}

      {post.type === 'task' && (
        <div className="relative mt-1">
          <button
            className="text-accent underline text-xs"
            onClick={() => setShowAddMenu((p) => !p)}
          >
            + Add Item
          </button>
          {showAddMenu && (
            <div className="absolute z-10 mt-1 bg-surface border border-secondary rounded shadow text-xs">
              <button
                onClick={() => {
                  setCreateType('log');
                  setShowAddMenu(false);
                }}
                className="block w-full text-left px-2 py-1 hover:bg-background"
              >
                Log
              </button>
              <button
                onClick={() => {
                  setCreateType('issue');
                  setShowAddMenu(false);
                }}
                className="block w-full text-left px-2 py-1 hover:bg-background"
              >
                Issue
              </button>
              <button
                onClick={() => {
                  setShowSubtaskForm(true);
                  setShowAddMenu(false);
                }}
                className="block w-full text-left px-2 py-1 hover:bg-background"
              >
                Subtask
              </button>
            </div>
          )}
        </div>
      )}

      {createType && (
        <div className="mt-2 space-y-1">
          <label className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={asCommit}
              onChange={(e) => setAsCommit(e.target.checked)}
            />
            Create commit entry
          </label>
          <CreatePost
            initialType={asCommit ? 'commit' : createType}
            questId={post.questId}
            boardId={post.questId ? `log-${post.questId}` : undefined}
            initialGitFilePath={asCommit ? post.gitFilePath : undefined}
            initialLinkedNodeId={asCommit ? post.nodeId : undefined}
            onSave={async (newPost) => {
              if (post.questId) {
                try {
                  await linkPostToQuest(post.questId, {
                    postId: newPost.id,
                    parentId: post.id,
                    title: newPost.questNodeTitle || makeHeader(newPost.content),
                  });
                  appendToBoard?.(`log-${post.questId}`, newPost);
                  loadGraph(post.questId);
                } catch (err) {
                  console.error('[PostCard] Failed to link new post:', err);
                }
              }
              setCreateType(null);
              setAsCommit(false);
            }}
            onCancel={() => {
              setCreateType(null);
              setAsCommit(false);
            }}
          />
        </div>
      )}

      {showSubtaskForm && (
        <div className="mt-2">
          <CreatePost
            initialType="task"
            questId={post.questId}
            boardId={post.questId ? `map-${post.questId}` : undefined}
            replyTo={post}
            onSave={async (newPost) => {
              if (post.questId) {
                try {
                  await linkPostToQuest(post.questId, {
                    postId: newPost.id,
                    parentId: post.id,
                    title: newPost.questNodeTitle || makeHeader(newPost.content),
                  });
                  appendToBoard?.(`map-${post.questId}`, newPost);
                  loadGraph(post.questId);
                } catch (err) {
                  console.error('[PostCard] Failed to link new subtask:', err);
                }
              }
              setShowSubtaskForm(false);
            }}
            onCancel={() => setShowSubtaskForm(false)}
          />
        </div>
      )}



      {(initialReplies > 0 || replies.length > 0) && (
        <button
          onClick={toggleReplies}
          className="text-accent underline text-xs"
        >
          {showReplies ? 'Hide Replies' : `\u{1F4AC} See Replies (${initialReplies || replies.length})`}
        </button>
      )}

      {!isLong && !compact && (
        <div>
          <button
            onClick={() => navigate(ROUTES.POST(post.id))}
            className="text-accent underline text-xs"
          >
            See more
          </button>
        </div>
      )}

      {replies.length > 0 && showReplies && (
        <div className="mt-2 space-y-2">
          {loadingReplies && (
            <div className="flex justify-center">
              <Spinner />
            </div>
          )}
          {replyError && <p className="text-xs text-error">{replyError}</p>}
          {replies.map((r) => (
            <NestedReply
              key={r.id}
              post={r}
              user={user}
              onUpdate={onUpdate}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default PostCard;
