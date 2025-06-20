import React, { useEffect, useState } from 'react';
import { fetchPostsByQuestId } from '../../api/post';
import type { Post } from '../../types/postTypes';
import { STATUS_OPTIONS } from '../../constants/options';
import StatusBadge from '../ui/StatusBadge';

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
  const [issues, setIssues] = useState<Post[]>([]);

  useEffect(() => {
    if (!questId) return;
    fetchPostsByQuestId(questId)
      .then((posts) => {
        setIssues(
          posts.filter(
            (p) => p.type === 'issue' && p.linkedNodeId === linkedNodeId,
          ),
        );
      })
      .catch((err) => {
        console.error('[StatusBoardPanel] failed to load issues', err);
      });
  }, [questId, linkedNodeId]);

  const grouped = STATUS_OPTIONS.reduce<Record<string, Post[]>>((acc, opt) => {
    acc[opt.value] = issues.filter((i) => i.status === opt.value);
    return acc;
  }, {});

  return (
    <div className="flex overflow-auto space-x-4">
      {STATUS_OPTIONS.map(({ value }) => (
        <div
          key={value}
          className="min-w-[200px] w-[240px] flex-shrink-0 bg-surface border border-secondary rounded-lg p-3 space-y-2"
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
                className="text-xs border border-secondary rounded p-2 bg-background space-y-1"
              >
                <div className="font-semibold">{issue.content}</div>
                {issue.status && <StatusBadge status={issue.status} />}
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
};

export default StatusBoardPanel;
