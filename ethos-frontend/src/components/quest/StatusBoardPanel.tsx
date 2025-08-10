import React, { useEffect, useState } from 'react';
import { fetchPostsByQuestId } from '../../api/post';
import type { Post } from '../../types/postTypes';
import { STATUS_OPTIONS } from '../../constants/options';
import StatusBadge from '../ui/StatusBadge';
import SummaryTag from '../ui/SummaryTag';
import { ROUTES } from '../../constants/routes';
import { getQuestLinkLabel } from '../../utils/displayUtils';
import QuickTaskForm from '../post/QuickTaskForm';

interface StatusBoardPanelProps {
  questId: string;
  linkedNodeId: string;
  /** Whether the panel starts open. Default false */
  initialOpen?: boolean;
}

const statusIcons: Record<string, string> = {
  'To Do': '🟦',
  'In Progress': '⏳',
  Blocked: '⛔',
  Done: '✅',
};

const StatusBoardPanel: React.FC<StatusBoardPanelProps> = ({
  questId,
  linkedNodeId,
  initialOpen = false,
}) => {
  const [items, setItems] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'tasks'>('all');
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(initialOpen);


  useEffect(() => {
    if (!questId) return;
    fetchPostsByQuestId(questId)
      .then((posts) => {
        setItems(
          posts.filter(
            (p) =>
              p.type === 'task' &&
              (p.linkedNodeId === linkedNodeId || p.replyTo === linkedNodeId),
          ),
        );
      })
      .catch((err) => {
        console.error('[StatusBoardPanel] failed to load issues', err);
      });
  }, [questId, linkedNodeId]);

  const filtered = items.filter((i) => {
    if (filter === 'tasks') return i.type === 'task';
    return true;
  });

  const grouped = STATUS_OPTIONS.reduce<Record<string, Post[]>>((acc, opt) => {
    acc[opt.value] = filtered.filter((i) => i.status === opt.value);
    return acc;
  }, {} as Record<string, Post[]>);

  const doneCount = grouped['Done']?.length ?? 0;
  const totalCount = filtered.length;

  return (
    <div className="border border-secondary rounded">
      <div
        className="flex justify-between items-center p-2 bg-soft cursor-pointer"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="font-semibold text-sm">Status Board</span>
        <div className="flex items-center gap-2">
          <span className="text-xs">
            {doneCount}/{totalCount} Done
          </span>
          <span className="text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="p-2 space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex gap-2 text-xs">
              <button
                className={`px-2 py-0.5 rounded border ${
                  filter === 'all' ? 'bg-accent text-white border-accent' : 'border-secondary'
                }`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`px-2 py-0.5 rounded border ${
                  filter === 'tasks' ? 'bg-accent text-white border-accent' : 'border-secondary'
                }`}
                onClick={() => setFilter('tasks')}
              >
                Tasks
              </button>
            </div>
            <button
              className="text-xs text-accent underline"
              onClick={() => setShowForm((p) => !p)}
            >
              {showForm ? '- Cancel' : '+ Add Item'}
            </button>
          </div>
          {showForm && (
            <div className="mb-2">
              <QuickTaskForm
                questId={questId}
                boardId={`log-${questId}`}
                parentId={linkedNodeId}
                onSave={(p) => {
                  setItems((prev) => [...prev, p]);
                  setShowForm(false);
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}
          <div className="flex overflow-auto space-x-2">
            {STATUS_OPTIONS.map(({ value }) => (
              <div
                key={value}
                className="min-w-[80px] w-28 flex-shrink-0 bg-surface border border-secondary rounded-lg p-2 space-y-2"
              >
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  <span>{statusIcons[value] || '➡️'}</span>
                  {value}
                  <span className="ml-auto text-xs text-secondary">
                    {grouped[value].length}
                  </span>
                </h4>
                {grouped[value].length === 0 ? (
                  <div className="text-xs text-secondary">No items</div>
                ) : (
                  grouped[value].map((task) => (
                    <div
                      key={task.id}
                      className="text-xs border border-secondary rounded p-1 bg-background space-y-1"
                    >
                      <span
                        title={task.title || task.content}
                        className="block truncate"
                      >
                        <SummaryTag
                          type="task"
                          label={getQuestLinkLabel(task, '', false)}
                          link={ROUTES.POST(task.id)}
                        />
                      </span>
                      {task.status && <StatusBadge status={task.status} />}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBoardPanel;
