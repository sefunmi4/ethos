import React, { useState } from 'react';
import { addPost } from '../../api/post';
import { linkPostToQuest } from '../../api/quest';
import { Input, Select, Button } from '../ui';
import { TASK_TYPE_OPTIONS, STATUS_OPTIONS } from '../../constants/options';
import { useBoardContext } from '../../contexts/BoardContext';
import type { Post } from '../../types/postTypes';

interface QuickTaskFormProps {
  questId: string;
  status?: string;
  boardId?: string;
  parentId?: string;
  onSave?: (post: Post) => void;
  onCancel: () => void;
}

const QuickTaskForm: React.FC<QuickTaskFormProps> = ({
  questId,
  status,
  boardId,
  parentId,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<'file' | 'folder'>('file');
  const [taskStatus, setTaskStatus] = useState(status || 'To Do');
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
        status: taskStatus,
        taskType,
        ...(boardId ? { boardId } : {}),
      });
      if (boardId) appendToBoard?.(boardId, newPost);
      if (parentId) {
        try {
          const makeHeader = (content: string): string => {
            const text = content.trim();
            return text.length <= 50 ? text : text.slice(0, 50) + '…';
          };
          await linkPostToQuest(questId, {
            postId: newPost.id,
            parentId,
            title: newPost.questNodeTitle || makeHeader(newPost.content),
          });
        } catch (err) {
          console.error('[QuickTaskForm] Failed to link task to quest:', err);
        }
      }
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
      {!status && (
        <Select
          value={taskStatus}
          onChange={(e) => setTaskStatus(e.target.value)}
          options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
        />
      )}
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
