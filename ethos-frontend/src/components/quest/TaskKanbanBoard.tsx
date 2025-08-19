import React, { useEffect, useState } from 'react';
import GridLayout from '../layout/GridLayout';
import { fetchPostsByQuestId } from '../../api/post';
import QuickTaskForm from '../post/QuickTaskForm';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface TaskKanbanBoardProps {
  questId: string;
  linkedNodeId: string;
  user?: User;
}

const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({ questId, linkedNodeId, user }) => {
  const [tasks, setTasks] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!questId) return;
    fetchPostsByQuestId(questId)
      .then((posts) => {
        setTasks(posts.filter((p) => p.type === 'task' && p.replyTo === linkedNodeId));
      })
      .catch((err) => {
        console.error('[TaskKanbanBoard] failed to load tasks', err);
      });
  }, [questId, linkedNodeId]);

  const refresh = () => {
    fetchPostsByQuestId(questId)
      .then((posts) => {
        setTasks(posts.filter((p) => p.type === 'task' && p.replyTo === linkedNodeId));
      })
      .catch((err) => {
        console.error('[TaskKanbanBoard] failed to load tasks', err);
      });
  };

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('taskUpdated', handler);
    return () => window.removeEventListener('taskUpdated', handler);
  }, [questId, linkedNodeId]);

  return (
    <div className="space-y-2">
      {showForm && (
        <QuickTaskForm
          questId={questId}
          boardId={`task-${linkedNodeId}`}
          parentId={linkedNodeId}
          onSave={(p) => {
            setTasks((prev) => [...prev, p]);
            setShowForm(false);
            refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
      <div className="text-right">
        <button onClick={() => setShowForm((p) => !p)} className="text-xs text-accent underline">
          {showForm ? '- Cancel' : '+ Add Task'}
        </button>
      </div>
      <GridLayout
        questId={questId}
        items={tasks}
        user={user}
        layout="kanban"
        compact
        editable
        boardId={`task-${linkedNodeId}`}
      />
    </div>
  );
};

export default TaskKanbanBoard;
