import React from 'react';
import PostCard from '../post/PostCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import LogThreadPanel from './LogThreadPanel';

interface QuestNodeInspectorProps {
  questId: string;
  node: Post | null;
  user?: User;
  showPost?: boolean;
  showLogs?: boolean;
}

const QuestNodeInspector: React.FC<QuestNodeInspectorProps> = ({ questId, node, user, showPost = true, showLogs = true }) => {
  if (!node) return <div className="p-2 text-sm">Select a task</div>;
  return (
    <div className="space-y-4">
      {showPost && <PostCard post={node} user={user} questId={questId} />}
      {showLogs && <LogThreadPanel questId={questId} node={node} user={user} />}
    </div>
  );
};

export default QuestNodeInspector;
