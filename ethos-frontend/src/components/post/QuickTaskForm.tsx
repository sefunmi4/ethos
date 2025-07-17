import React, { useState } from 'react';
import { addPost } from '../../api/post';
import { linkPostToQuest } from '../../api/quest';
import { Input, Select, Button } from '../ui';
import { TASK_TYPE_OPTIONS, STATUS_OPTIONS, type option } from '../../constants/options';
import { useBoardContext } from '../../contexts/BoardContext';
import type { BoardItem } from '../../contexts/BoardContextTypes';
import type { Post } from '../../types/postTypes';

interface QuickTaskFormProps {
  questId: string;
  status?: string;
  boardId?: string;
  parentId?: string;
  onSave?: (post: Post) => void;
  onCancel: () => void;
  allowIssue?: boolean;
}

const QuickTaskForm: React.FC<QuickTaskFormProps> = ({
  questId,
  status,
  boardId,
  parentId,
  onSave,
  onCancel,
  allowIssue = false,
}) => {
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<'file' | 'folder' | 'abstract'>('file');
  const [taskStatus, setTaskStatus] = useState(status || 'To Do');
  const [submitting, setSubmitting] = useState(false);
  const [postType, setPostType] = useState<'task' | 'issue'>('task');
  const { appendToBoard } = useBoardContext() || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      const newPost = await addPost({
        type: postType,
        content: title,
        visibility: 'public',
        questId,
        status: taskStatus,
        taskType,
        ...(boardId ? { boardId } : {}),
        ...(parentId ? { replyTo: parentId, linkedNodeId: parentId } : {}),
      });
      if (boardId) appendToBoard?.(boardId, newPost as BoardItem);
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
        placeholder="Item name"
        required
      />
      {allowIssue && (
        <Select
          value={postType}
          onChange={(e) => setPostType(e.target.value as 'task' | 'issue')}
          options={[
            { value: 'task', label: 'Task' },
            { value: 'issue', label: 'Issue' },
          ]}
        />
      )}
      <Select
        value={taskType}
        onChange={(e) =>
          setTaskType(e.target.value as 'file' | 'folder' | 'abstract')
        }
        options={TASK_TYPE_OPTIONS as option[]}
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
