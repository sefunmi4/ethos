import React, { useState } from 'react';
import PostCard from './PostCard';
import type { Post, EnrichedPost } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface NestedReplyProps {
  post: Post | EnrichedPost;
  user?: User;
  depth?: number;
  onUpdate?: (post: Post | { id: string; removed?: boolean }) => void;
  onDelete?: (id: string) => void;
}

const PREVIEW_LIMIT = 240;
const MAX_INDENT = 64; // limit indentation buildup

const NestedReply: React.FC<NestedReplyProps> = ({
  post,
  user,
  depth = 0,
  onUpdate,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const enriched = post as EnrichedPost;
  const content = enriched.renderedContent || post.content;
  const isLong = content.length > PREVIEW_LIMIT;

  const indent = Math.min(depth * 16, MAX_INDENT);

  return (
    <div
      className="border-l border-accent pl-4"
      style={{ marginLeft: indent, maxWidth: `calc(100% - ${indent}px)` }}
    >
      <PostCard
        post={post}
        user={user}
        compact={!expanded}
        onUpdate={onUpdate}
        onDelete={onDelete}
        depth={depth}
        className="mx-0"
      />
      {isLong && (
        <button
          className="text-accent underline text-xs mt-1"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : '…See more'}
        </button>
      )}
    </div>
  );
};

export default NestedReply;
