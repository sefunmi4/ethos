import React from 'react';
import type { Post, EnrichedPost } from '../../types/postTypes';
import FreeSpeechView from './expanded/FreeSpeechView';
import FileView from './expanded/FileView';
import TaskView from './expanded/TaskView';

type PostWithExtras = Post & Partial<EnrichedPost>;

interface ViewProps {
  post: PostWithExtras;
  expanded: boolean;
  compact?: boolean;
  onToggleTask?: (index: number, checked: boolean) => void;
  onTaskClick?: () => void;
  questId?: string | null;
}

const ExpandedCard: React.FC<ViewProps> = (props) => {
  const { post } = props;
  switch (post.type) {
    case 'task':
      return <TaskView {...props} />;
    case 'file':
      return <FileView {...props} />;
    case 'project':
    case 'free_speech':
      return <FreeSpeechView {...props} />;
    default:
      return <FreeSpeechView {...props} />;
  }
};

export default ExpandedCard;

