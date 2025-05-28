import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import EditPost from './EditPost';
import { Button, PostTypeBadge, ReactionButton } from '../ui';

const PostCard = ({ post, user, onUpdate, onDelete, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const canEdit = user?.id === post.authorId;
  let timestampLabel = 'Unknown time';
  try {
    if (post.timestamp) {
      timestampLabel = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
    }
  } catch (e) {
    console.warn('[PostCard] Invalid timestamp:', post.timestamp, e);
  }

  const handleSave = async (updated) => {
    await onUpdate(updated);
    setEditMode(false);
  };

  if (editMode) {
    return (
      <EditPost
        post={post}
        onCancel={() => setEditMode(false)}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="border rounded bg-white shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <PostTypeBadge type={post.type} />
          <span>{timestampLabel}</span>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="xs" variant="ghost" onClick={() => setEditMode(true)}>
              Edit
            </Button>
            <Button size="xs" variant="ghost" onClick={() => onDelete?.(post.id)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="text-gray-800 text-sm whitespace-pre-wrap">
        {compact && !isExpanded ? (
          <>
            {post.content.slice(0, 280)}{post.content.length > 280 && '...'}{' '}
            {post.content.length > 280 && (
              <button
                className="text-xs text-blue-600 underline"
                onClick={() => setIsExpanded(true)}
              >
                Expand
              </button>
            )}
          </>
        ) : (
          <>{post.content}</>
        )}
      </div>

      <div className="flex justify-between items-center">
        <ReactionButton postId={post.id} />
      </div>
    </div>
  );
};

export default PostCard;