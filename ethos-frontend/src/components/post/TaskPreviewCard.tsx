import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Select, StatusBadge, SummaryTag } from '../ui';
import { STATUS_OPTIONS, TASK_TYPE_OPTIONS } from '../../constants/options';
import type { Post, QuestTaskStatus } from '../../types/postTypes';
import { buildSummaryTags, type SummaryTagData } from '../../utils/displayUtils';
import type { SummaryTagData } from '../ui/SummaryTag';
import { ROUTES } from '../../constants/routes';
import { updatePost } from '../../api/post';
import { createRepoFolder } from '../../api/git';

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
  const [folderName, setFolderName] = useState('');
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
    const optimistic = { ...post, status: val };
    onUpdate?.(optimistic);
    document.dispatchEvent(
      new CustomEvent('taskUpdated', {
        detail: { task: optimistic },
        bubbles: true,
      })
    );
    try {
      const updated = await updatePost(post.id, { status: val });
      onUpdate?.(updated);
      document.dispatchEvent(
        new CustomEvent('taskUpdated', {
          detail: { task: updated },
          bubbles: true,
        })
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
    const optimistic = { ...post, taskType: val };
    onUpdate?.(optimistic);
    document.dispatchEvent(
      new CustomEvent('taskUpdated', {
        detail: { task: optimistic },
        bubbles: true,
      })
    );
    try {
      const updated = await updatePost(post.id, { taskType: val });
      onUpdate?.(updated);
      document.dispatchEvent(
        new CustomEvent('taskUpdated', {
          detail: { task: updated },
          bubbles: true,
        })
      );
    } catch (err) {
      console.error('[TaskPreviewCard] Failed to update task type', err);
    }
  };

  const handleOrganizeToggle = async (checked: boolean) => {
    setOrganizeFile(checked);
    if (checked) {
      const defaultName = post.content
        .trim()
        .split(/\s+/)[0]
        .replace(/[^a-z0-9_-]/gi, '_')
        .toLowerCase();
      setFolderName(defaultName || 'folder');
      if (post.questId) {
        try {
          await createRepoFolder(post.questId, defaultName || 'folder');
        } catch (err) {
          console.error('[TaskPreviewCard] Failed to create folder', err);
        }
      }
    }
  };

  const handleFolderSave = async () => {
    if (!post.questId || !folderName) return;
    try {
      await createRepoFolder(post.questId, folderName);
    } catch (err) {
      console.error('[TaskPreviewCard] Failed to create folder', err);
    }
  };

  const [summaryTags, setSummaryTags] = useState<SummaryTagData[]>([]);
  useEffect(() => {
    let active = true;
    buildSummaryTags(post).then(tags => {
      if (active) setSummaryTags(tags);
    });
    return () => {
      active = false;
    };
  }, [post]);
  let taskTag: SummaryTagData | undefined = summaryTags.find(
    t => t.type === 'task',
  );
  const questTag = summaryTags.find(t => t.type === 'quest');
  if (taskTag) {
    taskTag = {
      ...taskTag,
      label: post.nodeId
        ? post.nodeId.replace(/^Q:[^:]+:/, '')
        : taskTag.label.replace(/^Task\s*[-:]\s*/, ''),
      username: undefined,
      usernameLink: undefined,
      link: ROUTES.POST(post.id),
    };
  } else {
    const label = post.nodeId ? post.nodeId.replace(/^Q:[^:]+:/, '') : 'Task';
    taskTag = {
      type: 'task',
      label,
      detailLink: ROUTES.POST(post.id),
      link: ROUTES.POST(post.id),
    };
  }

  const tagNode = !hideSummaryTag && (taskTag || questTag) ? (
    <div className="flex flex-wrap gap-1">
      {taskTag && <SummaryTag {...taskTag} />}
      {questTag && <SummaryTag {...questTag} />}
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
            options={STATUS_OPTIONS}
            className="text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={taskType}
            onChange={handleTypeChange}
            options={TASK_TYPE_OPTIONS}
            className="text-xs"
          />
        </div>
        {taskType === 'file' && (
          <div className="space-y-1">
            <label className="inline-flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={organizeFile}
                onChange={(e) => handleOrganizeToggle(e.target.checked)}
              />
              Organize File
            </label>
            {organizeFile && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="border rounded px-1 py-0.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleFolderSave}
                  className="text-xs underline"
                >
                  Save
                </button>
              </div>
            )}
          </div>
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
          options={STATUS_OPTIONS}
          className="text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={taskType}
          onChange={handleTypeChange}
          options={TASK_TYPE_OPTIONS}
          className="text-xs"
        />
      </div>
      {taskType === 'file' && (
        <div className="space-y-1">
          <label className="inline-flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={organizeFile}
              onChange={(e) => handleOrganizeToggle(e.target.checked)}
            />
            Organize File
          </label>
          {organizeFile && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="border rounded px-1 py-0.5 text-xs"
              />
              <button
                type="button"
                onClick={handleFolderSave}
                className="text-xs underline"
              >
                Save
              </button>
            </div>
          )}
        </div>
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
