import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

import { fetchRepliesByPostId } from '../../api/post';
import ReactionControls from '../controls/ReactionControls';
import { PostTypeBadge } from '../ui';
import EditPost from './EditPost';
import ActionMenu from '../ui/ActionMenu';

interface PostCardProps {
  post: Post;
  user?: User;
  onUpdate?: (post: Post) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  questId?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post, user, onUpdate, onDelete, compact = false
}) => {
  const [editMode, setEditMode] = useState(false);
  const [replies, setReplies] = useState<Post[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [showFullDiff, setShowFullDiff] = useState(false);

  const navigate = useNavigate();

  const canEdit = user?.id === post.authorId || post.collaborators?.some(c => c.userId === user?.id);
  const timestamp = post.timestamp
    ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
    : 'Unknown time';

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

  const renderRepostInfo = () => {
    const quote = post.repostedFrom;
    if (!quote?.originalContent) return null;
    return (
      <blockquote className="border-l-4 pl-4 text-gray-500 italic bg-gray-50 rounded">
        “{quote.originalContent.length > 180 ? quote.originalContent.slice(0, 180) + '…' : quote.originalContent}”
        <div className="text-xs mt-1 text-gray-400">
          — @{quote.username || 'unknown'}
        </div>
      </blockquote>
    );
  };

  const renderLinkSummary = () => {
    if (!post.linkedItems || post.linkedItems.length === 0) return null;
    const sorted = [...post.linkedItems].sort((a, b) =>
      (b.title?.toLowerCase().includes('solution') ? 1 : 0) -
      (a.title?.toLowerCase().includes('solution') ? 1 : 0)
    );
    return (
      <div className="text-xs text-blue-600 space-y-1">
        {sorted.map((item) => {
          const label = `${item.itemType === 'quest' ? '🧭' : '📁'} ${item.title}${item.nodeId ? ` > ${item.nodeId}` : ''}`;
          return (
            <div key={item.itemId} className="flex gap-1 items-center">
              <span className="text-xs">🔗</span>
              <span className={`${item.title?.toLowerCase().includes('solution') ? 'font-semibold text-green-700' : ''}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
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
      <div className="text-sm bg-gray-50 rounded p-2 font-mono border">
        {post.commitSummary && (
          <div className="mb-1 text-gray-700 italic">{post.commitSummary}</div>
        )}
        {!showFullDiff && (
          <div className="mb-2">
            <button onClick={() => setShowFullDiff(true)} className="text-blue-600 text-xs underline">
              View full diff
            </button>
          </div>
        )}
        <pre className="overflow-x-auto whitespace-pre-wrap">
          {visibleLines.map((line, idx) => (
            <div key={idx} className={
              line.startsWith('+') ? 'text-green-600' :
              line.startsWith('-') ? 'text-red-600' : 'text-gray-800'}>
              {line}
            </div>
          ))}
        </pre>
        {!showFullDiff && (
          <div className="mt-1">
            <button
              onClick={() => navigate(`/posts/${post.id}`)}
              className="text-blue-600 text-xs underline"
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

  return (
    <div className="relative border rounded bg-white shadow-sm p-4 space-y-3">
      <div className="flex justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <PostTypeBadge type={post.type} />
          <span>{timestamp}</span>
        </div>
        <ActionMenu
          id={post.id}
          type="post"
          canEdit={canEdit}
          onEdit={() => setEditMode(true)}
          onDelete={() => onDelete?.(post.id)}
          permalink={`${window.location.origin}/posts/${post.id}`}
        />
      </div>

      {post.linkedNodeId && post.author?.username && (
        <div className="text-xs text-gray-500 italic">
          @{post.author.username} committed changes to <strong>{post.linkedNodeId}</strong> {timestamp}
        </div>
      )}

      {renderRepostInfo()}

      <div className="text-sm text-gray-800 whitespace-pre-wrap">
        {compact && post.content.length > 240 ? (
          <>
            {post.content.slice(0, 240)}…
            <button
              onClick={() => navigate(`/posts/${post.id}`)}
              className="text-blue-600 underline text-xs ml-1"
            >
              View more
            </button>
          </>
        ) : (
          post.content
        )}
      </div>

      {renderCommitDiff()}
      {renderLinkSummary()}

      <ReactionControls post={post} user={user} onUpdate={onUpdate} />

      {replies.length > 0 && (
        <div className="mt-3">
          <button onClick={toggleReplies} className="text-xs text-blue-600 hover:underline">
            {showReplies ? 'Hide Replies' : `Show Replies (${replies.length})`}
          </button>
          {loadingReplies && <p className="text-xs text-gray-400">Loading replies…</p>}
          {replyError && <p className="text-xs text-red-500">{replyError}</p>}
          {showReplies && (
            <div className="mt-2 space-y-2 border-l-2 border-blue-200 pl-4">
              {replies.map((r) => (
                <PostCard
                  key={r.id}
                  post={r}
                  user={user}
                  compact
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;