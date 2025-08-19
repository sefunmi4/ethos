import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MarkdownRenderer from '../../ui/MarkdownRenderer';
import MediaPreview from '../../ui/MediaPreview';
import { TAG_BASE } from '../../../constants/styles';
import { ROUTES } from '../../../constants/routes';
import type { Post, EnrichedPost } from '../../../types/postTypes';

const PREVIEW_LIMIT = 240;

export type PostWithExtras = Post & Partial<EnrichedPost>;

interface ViewProps {
  post: PostWithExtras;
  expanded: boolean;
  compact?: boolean;
  onToggleTask?: (index: number, checked: boolean) => void;
}

const FreeSpeechView: React.FC<ViewProps> = ({ post, expanded, compact, onToggleTask }) => {
  const content = post.renderedContent || post.content;
  const isLong = content.length > PREVIEW_LIMIT;
  const displayContent = isLong && !expanded ? content.slice(0, PREVIEW_LIMIT) + '…' : content;
  const clampClass = expanded ? '' : compact ? 'clamp-3' : 'clamp-4';
  const navigate = useNavigate();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Enter') {
      navigate(ROUTES.POST(post.id));
    }
  };

  return (
    <div className="text-sm text-primary">
      <Link
        to={ROUTES.POST(post.id)}
        className="block focus:outline-none"
        onKeyDown={handleKeyDown}
      >
        {post.title && <div className="font-semibold">{post.title}</div>}
        <div className={clampClass}>
          <MarkdownRenderer content={displayContent} onToggleTask={onToggleTask} />
        </div>
      </Link>
      <MediaPreview media={post.mediaPreviews} />
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {Array.from(new Set(post.tags)).map(tag => (
            <span key={tag} className={TAG_BASE}>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreeSpeechView;
