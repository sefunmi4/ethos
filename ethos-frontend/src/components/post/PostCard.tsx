import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { formatDistanceToNow } from 'date-fns';

import type { Post, PostType } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

import { fetchRepliesByPostId, updatePost, fetchPostsByQuestId, requestHelp, acceptRequest, unacceptRequest } from '../../api/post';
import { linkPostToQuest, fetchQuestById } from '../../api/quest';
import { useGraph } from '../../hooks/useGraph';
import ReactionControls from '../controls/ReactionControls';
import CreatePost from './CreatePost';
import { PostTypeBadge, StatusBadge, Spinner, Select } from '../ui';
import { STATUS_OPTIONS } from '../../constants/options';
import { useBoardContext } from '../../contexts/BoardContext';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import MediaPreview from '../ui/MediaPreview';
import LinkViewer from '../ui/LinkViewer';
import LinkControls from '../controls/LinkControls';
import EditPost from './EditPost';
import ActionMenu from '../ui/ActionMenu';
import GitFileBrowser from '../git/GitFileBrowser';
import NestedReply from './NestedReply';

const PREVIEW_LIMIT = 240;
const makeHeader = (content: string): string => {
  const text = content.trim();
  // TODO: replace with AI-generated summaries
  return text.length <= 50 ? text : text.slice(0, 50) + '…';
};

interface PostCardProps {
  post: Post;
  user?: User;
  onUpdate?: (post: Post) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  questId?: string;
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
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  user,
  onUpdate,
  onDelete,
  compact = false,
  questId,
  showStatusControl = true,
  replyOverride,
  headerOnly = false,
  depth = 0,
  className = '',
  initialShowReplies = false,
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
  const [edgeType, setEdgeType] = useState<'sub_problem' | 'solution_branch' | 'folder_split'>('sub_problem');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [questPosts, setQuestPosts] = useState<Post[]>([]);
  const [createType, setCreateType] = useState<'log' | 'issue' | null>(null);
  const [asCommit, setAsCommit] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [headPostId, setHeadPostId] = useState<string | null>(null);
  const { loadGraph } = useGraph();

  const navigate = useNavigate();
  const { selectedBoard, updateBoardItem, appendToBoard } = useBoardContext() || {};

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const optimistic = { ...post, status: newStatus };
    if (selectedBoard) updateBoardItem(selectedBoard, optimistic);
    onUpdate?.(optimistic);
    try {
      const updated = await updatePost(post.id, { status: newStatus });
      if (selectedBoard) updateBoardItem(selectedBoard, updated);
      onUpdate?.(updated);
    } catch (err) {
      console.error('[PostCard] Failed to update status:', err);
    }
  };

  const [helpRequested, setHelpRequested] = useState(post.helpRequest === true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(
    !!user && post.tags?.includes(`pending:${user.id}`)
  );

  const handleRequestHelp = async () => {
    try {
      const reqPost = await requestHelp(post.id);
      appendToBoard?.('quest-board', reqPost);
      setHelpRequested(true);
    } catch (err) {
      console.error('[PostCard] Failed to request help:', err);
    }
  };

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
  const timestamp = post.timestamp
    ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
    : 'Unknown time';

  const content = post.renderedContent || post.content;
  const titleText = post.title || (post.type === 'task' ? post.content : '');
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
    try {
      const updated = await updatePost(post.id, { content: updatedContent });
      onUpdate?.(updated);
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
    if (!post.linkedItems || post.linkedItems.length === 0) return null;
    return <LinkViewer items={post.linkedItems} />;
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
          'relative border border-secondary rounded bg-surface shadow-sm p-4 space-y-3 text-primary max-w-prose',
          depth === 0 ? 'mx-auto' : '',
          className
        )}
      >
        <div className="flex justify-between text-sm text-secondary">
          <div className="flex items-center gap-2">
            <PostTypeBadge type={post.type} />
            {post.status && <StatusBadge status={post.status} />}
            <button
              type="button"
              onClick={() =>
                navigate(
                  post.authorId === user?.id
                    ? ROUTES.PROFILE
                    : ROUTES.PUBLIC_PROFILE(post.authorId)
                )
              }
              className="text-accent underline"
            >
              @{post.author?.username || post.authorId}
            </button>
            <span>{timestamp}</span>
          </div>
        </div>
        {titleText && (
          <h3 className="font-semibold text-lg mt-1 cursor-pointer" onClick={() => navigate(ROUTES.POST(post.id))}>
            {titleText}
          </h3>
        )}
        <ReactionControls post={post} user={user} onUpdate={onUpdate} replyOverride={replyOverride} />
        {post.type === 'request' && (
          <button
            className="text-accent underline text-xs ml-2"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? 'Pending…' : accepted ? 'Pending' : 'Accept'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id={post.id}
      className={clsx(
        'relative border border-secondary rounded bg-surface shadow-sm p-4 space-y-3 text-primary max-w-prose',
        depth === 0 ? 'mx-auto' : '',
        className
      )}
    >
      <div className="flex justify-between text-sm text-secondary">
        <div className="flex items-center gap-2">
          <PostTypeBadge type={post.type} />
          {post.status && <StatusBadge status={post.status} />}
          {canEdit && ['task', 'request', 'issue'].includes(post.type) && showStatusControl && (
            <div className="ml-1 w-28">
              <Select
                value={post.status || 'To Do'}
                onChange={handleStatusChange}
                options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              navigate(
                post.authorId === user?.id
                  ? ROUTES.PROFILE
                  : ROUTES.PUBLIC_PROFILE(post.authorId)
              )
            }
            className="text-accent underline"
          >
            @{post.author?.username || post.authorId}
          </button>
          <span>{timestamp}</span>
        </div>
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

      {post.linkedNodeId && post.author?.username && (
        <div className="text-xs text-secondary italic">
          @{post.author.username} committed changes to <strong>{post.linkedNodeId}</strong> {timestamp}
        </div>
      )}

      {renderRepostInfo()}

      {titleText && (
        <h3 className="font-semibold text-lg mt-1">{titleText}</h3>
      )}

      <div className="text-sm text-primary">
        {post.type === 'task' ? (
          <>
            <div className="font-semibold">{post.content}</div>
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
            {post.tags.map(tag => (
              <span
                key={tag}
                className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {renderCommitDiff()}
      {renderLinkSummary()}

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
                    onChange={e => setEdgeType(e.target.value as any)}
                  >
                    <option value="sub_problem">sub_problem</option>
                    <option value="solution_branch">solution_branch</option>
                    <option value="folder_split">folder_split</option>
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

      <ReactionControls
        post={post}
        user={user}
        onUpdate={onUpdate}
        replyOverride={replyOverride}
      />
      {post.type === 'request' && (
        <button
          className="text-accent underline text-xs ml-2"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? 'Pending…' : accepted ? 'Pending' : 'Accept'}
        </button>
      )}

      {post.type === 'task' && post.linkedNodeId && post.questId && (
        <>
          <button
            onClick={() => setShowBrowser(true)}
            className="text-accent underline text-xs mt-1"
          >
            View File/Folder
          </button>
          {showBrowser && (
            <GitFileBrowser
              questId={post.questId}
              onClose={() => setShowBrowser(false)}
            />
          )}
        </>
      )}

      {post.type === 'task' && (
        <div className="flex gap-2 mt-1">
          <button
            className="text-accent underline text-xs"
            onClick={() => setCreateType('log')}
          >
            Add Log
          </button>
          <button
            className="text-accent underline text-xs"
            onClick={() => setCreateType('issue')}
          >
            Add Issue
          </button>
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

      {post.type !== 'request' && post.type !== 'free_speech' && (
        <label className="flex items-center gap-1 text-xs mt-1">
          <input
            type="checkbox"
            checked={helpRequested}
            onChange={() => !helpRequested && handleRequestHelp()}
          />
          Request Help
          {helpRequested && (
            <span className="ml-1 text-secondary">tracking</span>
          )}
        </label>
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
