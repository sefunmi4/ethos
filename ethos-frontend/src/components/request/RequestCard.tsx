import React, { useState } from 'react';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { PostTypeBadge, Button } from '../ui';
import CreatePost from '../post/CreatePost';

interface RequestCardProps {
  post: Post;
  user?: User;
  onUpdate?: (post: Post) => void;
  className?: string;
}

const RequestCard: React.FC<RequestCardProps> = ({ post, user, onUpdate, className }) => {
  const [showReply, setShowReply] = useState(false);
  const collaboratorCount = post.collaborators?.filter(c => c.userId).length || 0;

  return (
    <div className={"border border-secondary rounded bg-surface p-4 space-y-2 " + (className || '')}>
      <div className="flex items-center gap-2 text-sm text-secondary">
        <PostTypeBadge type="request" />
        {post.questId && <PostTypeBadge type="quest" />}
      </div>
      {post.title && <h3 className="font-semibold text-lg">{post.title}</h3>}
      {post.content && <p className="text-sm text-primary">{post.content}</p>}
      <div className="text-xs text-secondary">
        {collaboratorCount} collaborators approved
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowReply(r => !r)}>
          {showReply ? 'Cancel' : 'Reply'}
        </Button>
        <Button variant="primary" size="sm">
          {post.questId ? 'Join' : 'Apply'}
        </Button>
      </div>
      {showReply && (
        <CreatePost
          replyTo={post}
          onSave={(p) => {
            onUpdate?.(p);
            setShowReply(false);
          }}
          onCancel={() => setShowReply(false)}
        />
      )}
    </div>
  );
};

export default RequestCard;
