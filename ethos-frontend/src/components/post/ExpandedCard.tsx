import React from 'react';
import MapGraphLayout from '../layout/MapGraphLayout';
import GitFileBrowserInline from '../git/GitFileBrowserInline';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import MediaPreview from '../ui/MediaPreview';
import { TAG_BASE } from '../../constants/styles';
import type { Post, EnrichedPost } from '../../types/postTypes';
import FreeSpeechView from './expanded/FreeSpeechView';

const PREVIEW_LIMIT = 240;

type PostWithExtras = Post & Partial<EnrichedPost>;

interface ViewProps {
  post: PostWithExtras;
  expanded: boolean;
  compact?: boolean;
  onToggleTask?: (index: number, checked: boolean) => void;
  onTaskClick?: () => void;
  questId?: string | null;
}

export const TaskView: React.FC<ViewProps> = ({ post, expanded, compact, onToggleTask, onTaskClick, questId }) => {
  const isLong = (post.details || '').length > PREVIEW_LIMIT;
  return (
    <div className="text-sm text-primary">
      <div className="font-semibold cursor-pointer" onClick={onTaskClick}>
        {post.content}
      </div>
      {post.details && (
        <div className={compact ? 'clamp-3' : ''}>
          <MarkdownRenderer
            content={isLong && !expanded ? post.details.slice(0, PREVIEW_LIMIT) + '…' : post.details}
            onToggleTask={onToggleTask}
          />
        </div>
      )}
      <MediaPreview media={post.mediaPreviews} />
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {Array.from(new Set(post.tags)).map(tag => (
            <span key={tag} className={TAG_BASE}>#{tag}</span>
          ))}
        </div>
      )}
      {expanded && questId && (
        <>
          <MapGraphLayout items={[]} edges={[]} />
          <GitFileBrowserInline questId={questId} />
        </>
      )}
    </div>
  );
};

const ExpandedCard: React.FC<ViewProps> = (props) => {
  const { post } = props;
  switch (post.type) {
    case 'task':
      return <TaskView {...props} />;
    case 'file':
    case 'project':
    case 'free_speech':
      return <FreeSpeechView {...props} />;
    default:
      return <FreeSpeechView {...props} />;
  }
};

export default ExpandedCard;
