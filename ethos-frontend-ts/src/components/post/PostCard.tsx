import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns'; 


import type { Post } from '../../types/postTypes'; 
import type { User } from '../../types/userTypes';
import { axiosWithAuth } from '../../utils/authUtils';
import ReactionButtons from '../controls/ReactionButtons'; //TODO: ReactionButtons ReactionButtons
import { PostTypeBadge } from '../ui'; //TODO: PostTypeBadge ui
import EditPost from './EditPost';
import ActionMenu from '../ui/ActionMenu';

interface PostCardProps {
  post: Post;
  user?: User;
  onUpdate?: (post: Post) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post, user, onUpdate, onDelete, compact = false
}) => {
  const [editMode, setEditMode] = useState(false);
  const [replies, setReplies] = useState<Post[]>([]);
  const [showReplies, setShowReplies] = useState(false);

  const navigate = useNavigate();

  const canEdit = user?.id === post.authorId || post.collaborators?.includes(user?.id || '');
  const timestamp = post.timestamp
    ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
    : 'Unknown time';

  // Toggle reply visibility
  const toggleReplies = () => setShowReplies(prev => !prev);

  // Load replies
  useEffect(() => {
    const loadReplies = async () => {
      try {
        const res = await axiosWithAuth.get(`/posts/${post.id}/replies`);
        setReplies(res.data.replies || []);
      } catch (err) {
        console.error(`[PostCard] Load replies failed:`, err);
      }
    };
    loadReplies();
  }, [post.id]);

  // Repost quote block
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

  // Linked quests/projects
  const renderLinkSummary = () => {
    if (!post.linkedItems || post.linkedItems.length === 0) return null;
    return (
      <div className="text-xs text-blue-600 space-y-1">
        {post.linkedItems.map((item) => {
          const label = `${item.itemType === 'quest' ? '🧭' : '📁'} ${item.name}${item.nodeId ? ` > ${item.nodeId}` : ''}`;
          return (
            <div key={item.itemId}>
              🔗 {label}
            </div>
          );
        })}
      </div>
    );
  };

  // Edit mode
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
      {/* Header: Post type and actions */}
      <div className="flex justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <PostTypeBadge type={post.type} />
          <span>{timestamp}</span>
        </div>
        <ActionMenu
            id={post.id}
            type="post"
            canEdit={canEdit}
        />
      </div>
      

      {/* Repost content */}
      {renderRepostInfo()}

      {/* Main content */}
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

      {/* Links */}
      {renderLinkSummary()}

      {/* Reactions */}
      <ReactionButtons post={post} user={user} onUpdate={onUpdate} />

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3">
          <button onClick={toggleReplies} className="text-xs text-blue-600 hover:underline">
            {showReplies ? 'Hide Replies' : `Show Replies (${replies.length})`}
          </button>
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