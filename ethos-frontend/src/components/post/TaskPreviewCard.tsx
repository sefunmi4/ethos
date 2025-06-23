import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Select, StatusBadge, SummaryTag } from '../ui';
import { STATUS_OPTIONS, TASK_TYPE_OPTIONS } from '../../constants/options';
import type { option } from '../../constants/options';
import type { Post, QuestTaskStatus } from '../../types/postTypes';
import { buildSummaryTags } from '../../utils/displayUtils';
import { ROUTES } from '../../constants/routes';
import { updatePost } from '../../api/post';

interface TaskPreviewCardProps {
  post: Post;
  onUpdate?: (updated: Post) => void;
  summaryOnly?: boolean;
  hideSummaryTag?: boolean;
}

const makeHeader = (content: string): string => {
  const text = content.trim();
  return text.length <= 50 ? text : text.slice(0, 50) + '…';
};

const TaskPreviewCard: React.FC<TaskPreviewCardProps> = ({
  post,
  onUpdate,
  summaryOnly = false,
  hideSummaryTag = false,
}) => {
  const [status, setStatus] = useState<QuestTaskStatus>(post.status || 'To Do');
  const [taskType, setTaskType] = useState(post.taskType || 'abstract');
  const [organizeFile, setOrganizeFile] = useState(false);
  const [plannerFile, setPlannerFile] = useState(false);
  const difficultyTag = post.tags?.find(t => t.toLowerCase().startsWith('difficulty:'));
  const roleTag = post.tags?.find(t => t.toLowerCase().startsWith('role:'));
  const rankTag = post.tags?.find(t => t.toLowerCase().startsWith('min_rank:'));
  const difficulty = difficultyTag ? difficultyTag.split(':')[1] : undefined;
  const role = roleTag ? roleTag.split(':')[1] : undefined;
  const minRank = rankTag ? rankTag.split(':')[1] : undefined;
  const headerText = post.questNodeTitle || makeHeader(post.content);
  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const val = e.target.value as QuestTaskStatus;
    setStatus(val);
    onUpdate?.({ ...post, status: val });
    try {
      const updated = await updatePost(post.id, { status: val });
      onUpdate?.(updated);
      document.dispatchEvent(
        new CustomEvent('taskUpdated', { detail: { task: updated } })
      );
    } catch (err) {
      console.error('[TaskPreviewCard] Failed to update status', err);
    }
  };
  const handleTypeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const val = e.target.value as 'file' | 'folder' | 'abstract';
    setTaskType(val);
    onUpdate?.({ ...post, taskType: val });
    try {
      const updated = await updatePost(post.id, { taskType: val });
      onUpdate?.(updated);
      document.dispatchEvent(
        new CustomEvent('taskUpdated', { detail: { task: updated } })
      );
    } catch (err) {
      console.error('[TaskPreviewCard] Failed to update task type', err);
    }
  };

  const summaryTags = buildSummaryTags(post);
  let taskTag = summaryTags.find(t => t.type === 'task');
  const shortTitle = headerText.length > 20 ? headerText.slice(0, 20) + '...' : headerText;
  if (taskTag) {
    taskTag = {
      ...taskTag,
      label: post.nodeId
        ? `Q::${post.nodeId.replace(/^Q:[^:]+:/, '')}:${shortTitle}`
        : taskTag.label.replace(/^Task\s*[-:]\s*/, ''),
      username: undefined,
      usernameLink: undefined,
      link: ROUTES.POST(post.id),
    } as any;
  } else {
    const label = post.nodeId
      ? `Q::${post.nodeId.replace(/^Q:[^:]+:/, '')}:${shortTitle}`
      : 'Task';
    taskTag = {
      type: 'task',
      label,
      detailLink: ROUTES.POST(post.id),
      link: ROUTES.POST(post.id),
    } as any;
  }

  const tagNode = !hideSummaryTag && taskTag ? (
    <div className="flex flex-wrap gap-1">
      <SummaryTag {...taskTag} />
    </div>
  ) : null;

  if (summaryOnly) {
    return (
      <div className="border border-secondary rounded bg-surface p-2 text-xs space-y-1">
        {tagNode}
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <Select
            value={status}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS as option[]}
            className="text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={taskType}
            onChange={handleTypeChange}
            options={TASK_TYPE_OPTIONS as option[]}
            className="text-xs"
          />
        </div>
        {taskType === 'file' && (
          <label className="inline-flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={organizeFile}
              onChange={(e) => setOrganizeFile(e.target.checked)}
            />
            Organize File
          </label>
        )}
        {taskType === 'folder' && (
          <label className="inline-flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={plannerFile}
              onChange={(e) => setPlannerFile(e.target.checked)}
            />
            Make Planner File
          </label>
        )}
        {taskType === 'abstract' && (
          <label className="inline-flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={plannerFile}
              onChange={(e) => setPlannerFile(e.target.checked)}
            />
            Make Planner File
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="border border-secondary rounded bg-surface p-2 text-xs space-y-1">
      {tagNode}
      <div className="font-semibold text-sm truncate">
        <Link to={ROUTES.POST(post.id)} className="hover:underline">
          {headerText}
        </Link>
      </div>
      {post.gitFilePath && (
        <div className="text-secondary">{post.gitFilePath}</div>
      )}
      <div className="flex items-center gap-2">
        <StatusBadge status={status} />
        <Select
          value={status}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS as option[]}
          className="text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={taskType}
          onChange={handleTypeChange}
          options={TASK_TYPE_OPTIONS as option[]}
          className="text-xs"
        />
      </div>
      {taskType === 'file' && (
        <label className="inline-flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={organizeFile}
            onChange={(e) => setOrganizeFile(e.target.checked)}
          />
          Organize File
        </label>
      )}
      {taskType === 'folder' && (
        <label className="inline-flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={plannerFile}
            onChange={(e) => setPlannerFile(e.target.checked)}
          />
          Make Planner File
        </label>
      )}
      {taskType === 'abstract' && (
        <label className="inline-flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={plannerFile}
            onChange={(e) => setPlannerFile(e.target.checked)}
          />
          Make Planner File
        </label>
      )}
      {(role || minRank || difficulty) && (
        <div className="space-y-0.5">
          {role && <div>Role: {role}</div>}
          {minRank && <div>Min Rank: {minRank}</div>}
          {difficulty && <div>Difficulty: {difficulty}</div>}
        </div>
      )}
    </div>
  );
};

export default TaskPreviewCard;
