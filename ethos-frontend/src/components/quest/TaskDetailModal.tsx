import React from 'react';
import QuestNodeInspector from './QuestNodeInspector';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface TaskDetailModalProps {
  task: Post;
  questId: string;
  user?: User;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, questId, user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface p-4 rounded w-full max-w-xl max-h-full overflow-auto">
        <div className="text-right mb-2">
          <button className="text-accent underline text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <QuestNodeInspector questId={questId} node={task} user={user} />
      </div>
    </div>
  );
};

export default TaskDetailModal;
