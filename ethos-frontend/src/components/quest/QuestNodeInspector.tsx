import React from 'react';
import type { Post } from '../../types/postTypes';
import PostCard from '../post/PostCard';
import StatusBoardPanel from './StatusBoardPanel';

interface QuestNodeInspectorProps {
  node: Post | null;
  questId: string;
}

const QuestNodeInspector: React.FC<QuestNodeInspectorProps> = ({ node, questId }) => {
  if (!node) {
    return <div className="p-2 text-sm text-secondary">Select a node</div>;
  }
  return (
    <div className="space-y-4">
      <PostCard post={node} questId={questId} />
      <StatusBoardPanel questId={questId} linkedNodeId={node.id} />
    </div>
  );
};

export default QuestNodeInspector;
