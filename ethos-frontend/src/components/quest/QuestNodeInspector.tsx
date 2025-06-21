import React, { useState, useEffect } from 'react';
import PostCard from '../post/PostCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import LogThreadPanel from './LogThreadPanel';
import { Select } from '../ui';
import { updatePost } from '../../api/post';
import { TASK_TYPE_OPTIONS } from '../../constants/options';

interface QuestNodeInspectorProps {
  questId: string;
  node: Post | null;
  user?: User;
  showPost?: boolean;
  showLogs?: boolean;
}

const QuestNodeInspector: React.FC<QuestNodeInspectorProps> = ({ questId, node, user, showPost = true, showLogs = true }) => {
  const [type, setType] = useState<string>(node?.taskType || 'abstract');

  useEffect(() => {
    setType(node?.taskType || 'abstract');
  }, [node?.taskType]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setType(val);
    if (node) {
      try {
        await updatePost(node.id, { taskType: val });
      } catch (err) {
        console.error('[QuestNodeInspector] Failed to update task type', err);
      }
    }
  };

  if (!node) return <div className="p-2 text-sm">Select a task</div>;
  return (
    <div className="space-y-4">
      {showPost && <PostCard post={node} user={user} questId={questId} />}
      {node.type === 'task' && (
        <Select
          id="task-type"
          value={type}
          onChange={handleChange}
          options={TASK_TYPE_OPTIONS as any}
        />
      )}
      {showLogs && <LogThreadPanel questId={questId} node={node} user={user} />}
    </div>
  );
};

export default QuestNodeInspector;
