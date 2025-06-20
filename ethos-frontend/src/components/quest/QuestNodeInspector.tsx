import React from 'react';
import type { Post } from '../../types/postTypes';

interface QuestNodeInspectorProps {
  node: Post;
  onClose: () => void;
}

const QuestNodeInspector: React.FC<QuestNodeInspectorProps> = ({ node, onClose }) => {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Node Details</h2>
        <button onClick={onClose} className="text-xl leading-none">&times;</button>
      </div>
      <p className="text-sm whitespace-pre-wrap">{node.content}</p>
    </div>
  );
};

export default QuestNodeInspector;
