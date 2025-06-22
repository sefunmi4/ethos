import React, { useState } from 'react';
import { addPost } from '../../api/post';
import { Input, Select, Button } from '../ui';
import { TASK_TYPE_OPTIONS } from '../../constants/options';
import { useBoardContext } from '../../contexts/BoardContext';
import type { Post } from '../../types/postTypes';

interface QuickTaskFormProps {
  questId: string;
  status: string;
  boardId: string;
  onSave?: (post: Post) => void;
  onCancel: () => void;
}

const QuickTaskForm: React.FC<QuickTaskFormProps> = ({ questId, status, boardId, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<'file' | 'folder'>('file');
  const [submitting, setSubmitting] = useState(false);
  const { appendToBoard } = useBoardContext() || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      const newPost = await addPost({
        type: 'task',
        content: title,
        visibility: 'public',
        questId,
        status,
        taskType,
        boardId,
      });
      appendToBoard?.(boardId, newPost);
      onSave?.(newPost);
    } catch (err) {
      console.error('[QuickTaskForm] Failed to create task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border border-secondary rounded p-2 bg-background">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task name"
        required
      />
      <Select
        value={taskType}
        onChange={(e) => setTaskType(e.target.value as 'file' | 'folder')}
        options={TASK_TYPE_OPTIONS.filter((o) => o.value !== 'abstract')}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="contrast" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </form>
  );
};

export default QuickTaskForm;
