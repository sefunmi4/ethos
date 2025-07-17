import React, { useState, useEffect } from 'react';
import PostCard from '../post/PostCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import LogThreadPanel from './LogThreadPanel';
import FileEditorPanel from './FileEditorPanel';
import TeamPanel from './TeamPanel';
import SubtaskChecklist from './SubtaskChecklist';
import GitDiffViewer from '../git/GitDiffViewer';
import { useGitDiff } from '../../hooks/useGit';
import { Select } from '../ui';
import { updatePost } from '../../api/post';
import { TASK_TYPE_OPTIONS, STATUS_OPTIONS } from '../../constants/options';
import type { option } from '../../constants/options';
import type { QuestTaskStatus } from '../../types/postTypes';

interface QuestNodeInspectorProps {
  questId: string;
  node: Post | null;
  user?: User;
  showPost?: boolean;
  showLogs?: boolean;
  status?: QuestTaskStatus;
  onStatusChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onUpdate?: (p: Post) => void;
  hideSelects?: boolean;
}

const QuestNodeInspector: React.FC<QuestNodeInspectorProps> = ({
  questId,
  node,
  user,
  showPost = true,
  showLogs = true,
  status,
  onStatusChange,
  onUpdate,
  hideSelects = false,
}) => {
  const [type, setType] = useState<string>(node?.taskType || 'abstract');
  const [activeTab, setActiveTab] = useState<'file' | 'logs' | 'options'>('file');
  const [statusVal, setStatusVal] = useState<QuestTaskStatus>(status || node?.status || 'To Do');
  const { data: diffData, isLoading: diffLoading } = useGitDiff({
    questId,
    filePath: node?.gitFilePath,
    commitId: node?.gitCommitSha,
  });

  useEffect(() => {
    setType(node?.taskType || 'abstract');
    setStatusVal(status || node?.status || 'To Do');
  }, [node?.taskType, node?.status, status]);

  useEffect(() => {
    setActiveTab('file');
  }, [node?.id]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setType(val);
    setActiveTab('file');
    if (node) {
      // Optimistically update local state so parent components react immediately
      const optimistic = { ...node, taskType: val } as Post;
      onUpdate?.(optimistic);
      document.dispatchEvent(
        new CustomEvent('taskUpdated', {
          detail: { task: optimistic },
          bubbles: true,
        })
      );
      try {
        const updated = await updatePost(node.id, {
          taskType: val as 'file' | 'folder' | 'abstract',
        });
        onUpdate?.(updated);
        document.dispatchEvent(
          new CustomEvent('taskUpdated', {
            detail: { task: updated },
            bubbles: true,
          })
        );
      } catch (err) {
        console.error('[QuestNodeInspector] Failed to update task type', err);
      }
    }
  };

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as QuestTaskStatus;
    setStatusVal(newStatus);
    onStatusChange?.(e);
    if (node) {
      // Optimistically update local state for immediate UI feedback
      const optimistic = { ...node, status: newStatus } as Post;
      onUpdate?.(optimistic);
      document.dispatchEvent(
        new CustomEvent('taskUpdated', {
          detail: { task: optimistic },
          bubbles: true,
        })
      );
      try {
        const updated = await updatePost(node.id, { status: newStatus });
        onUpdate?.(updated);
        document.dispatchEvent(
          new CustomEvent('taskUpdated', {
            detail: { task: updated },
            bubbles: true,
          })
        );
      } catch (err) {
        console.error('[QuestNodeInspector] Failed to update status', err);
      }
    }
  };


  if (!node) return <div className="p-2 text-sm">Select a task</div>;

  const canEdit =
    user?.id === node.authorId ||
    (node.collaborators || []).some(c => c.userId === user?.id);

  const tabs = [
    {
      value: 'file',
      label: type === 'file' ? 'File' : type === 'folder' ? 'Folder' : 'Planner',
    },
    ...(showLogs ? [{ value: 'logs', label: 'Logs' }] : []),
    { value: 'options', label: canEdit ? 'Options' : 'Team' },
  ];

  let panel: React.ReactNode = null;
  switch (activeTab) {
    case 'logs':
      panel = <LogThreadPanel questId={questId} node={node} user={user} />;
      break;
    case 'file':
      panel = (
        <div className="space-y-2">
          {type === 'file' ? (
            <>
              {diffLoading ? null : diffData?.diffMarkdown && (
                <GitDiffViewer markdown={diffData.diffMarkdown} />
              )}
              <FileEditorPanel
                questId={questId}
                filePath={node.gitFilePath || 'file.txt'}
                content={node.content}
              />
            </>
          ) : (
            <SubtaskChecklist questId={questId} nodeId={node.id} />
          )}
        </div>
      );
      break;
    case 'options':
      panel = <TeamPanel questId={questId} node={node} canEdit={canEdit} />;
      break;
    default:
      panel = null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 space-y-2 flex-1 overflow-auto">
        {showPost && <PostCard post={node} user={user} questId={questId} />}
        {node.type === 'task' && !hideSelects && (
          <div className="space-y-2">
            <Select
              id="task-type"
              value={type}
              onChange={handleChange}
              options={TASK_TYPE_OPTIONS}
            />
            <Select
              id="task-status"
              value={statusVal}
              onChange={handleStatusSelect}
              options={STATUS_OPTIONS}
            />
          </div>
        )}
        <div className="border-b border-secondary flex items-center text-sm overflow-x-auto whitespace-nowrap">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value as typeof activeTab)}
              className={`px-3 py-1 -mb-px border-b-2 ${
                activeTab === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-2">{panel}</div>
      </div>
    </div>
  );
};

export default QuestNodeInspector;