import React, { useEffect, useState } from 'react';
import { fetchPostsByQuestId } from '../../api/post';
import type { Post } from '../../types/postTypes';
import { STATUS_OPTIONS } from '../../constants/options';
import StatusBadge from '../ui/StatusBadge';
import QuickTaskForm from '../post/QuickTaskForm';

interface StatusBoardPanelProps {
  questId: string;
  linkedNodeId: string;
}

const statusIcons: Record<string, string> = {
  'To Do': '🟦',
  'In Progress': '⏳',
  Blocked: '⛔',
  Done: '✅',
};

const StatusBoardPanel: React.FC<StatusBoardPanelProps> = ({ questId, linkedNodeId }) => {
  const [items, setItems] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'issues' | 'tasks'>('all');
  const [showForm, setShowForm] = useState(false);


  useEffect(() => {
    if (!questId) return;
    fetchPostsByQuestId(questId)
      .then((posts) => {
        setItems(
          posts.filter(
            (p) =>
              (p.type === 'issue' && p.linkedNodeId === linkedNodeId) ||
              (p.type === 'task' && p.replyTo === linkedNodeId),
          ),
        );
      })
      .catch((err) => {
        console.error('[StatusBoardPanel] failed to load issues', err);
      });
  }, [questId, linkedNodeId]);

  const filtered = items.filter((i) => {
    if (filter === 'issues') return i.type === 'issue';
    if (filter === 'tasks') return i.type === 'task';
    return true;
  });

  const grouped = STATUS_OPTIONS.reduce<Record<string, Post[]>>((acc, opt) => {
    acc[opt.value] = filtered.filter((i) => i.status === opt.value);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-between items-start mb-2">
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
              filter === 'issues' ? 'bg-accent text-white border-accent' : 'border-secondary'
            }`}
            onClick={() => setFilter('issues')}
          >
            Issues
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
            allowIssue
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
            </h4>
            {grouped[value].length === 0 ? (
              <div className="text-xs text-secondary">No items</div>
            ) : (
              grouped[value].map((issue) => (
                <div
                  key={issue.id}
                  className="text-xs border border-secondary rounded p-1 bg-background space-y-1"
                >
                  <div className="font-semibold truncate">
                    {issue.content.length > 15 ? `${issue.content.slice(0, 12)}…` : issue.content}
                  </div>
                  {issue.status && <StatusBadge status={issue.status} />}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusBoardPanel;
