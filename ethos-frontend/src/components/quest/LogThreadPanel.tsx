import React, { useEffect, useState } from 'react';
import PostCard from '../post/PostCard';
import ReplyThread from '../post/ReplyThread';
import { Spinner } from '../ui';
import { fetchPostsByQuestId } from '../../api/post';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import QuickTaskForm from '../post/QuickTaskForm';

interface LogThreadPanelProps {
  questId: string;
  node: Post | null;
  user?: User;
  onCommitSelect?: (p: Post) => void;
}

const LogThreadPanel: React.FC<LogThreadPanelProps> = ({ questId, node, user, onCommitSelect }) => {
  const [entries, setEntries] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);

  const handleAddTask = () => {
    setShowForm(true);
  };

  useEffect(() => {
    if (!node) return;
    setLoading(true);
    fetchPostsByQuestId(questId)
      .then((posts) => {
        const tasks = posts.filter(
          (p) => p.type === 'task' && p.replyTo === node.id,
        );
        tasks.sort((a, b) => {
          const aTime = a.createdAt || a.timestamp;
          const bTime = b.createdAt || b.timestamp;
          return aTime.localeCompare(bTime);
        });
        setEntries(tasks);
      })
      .catch((err) => console.error('[LogThreadPanel] load failed', err))
      .finally(() => setLoading(false));
  }, [questId, node]);

  if (!node) return null;
  if (loading) return <Spinner />;
  if (entries.length === 0)
    return (
      <div className="space-y-2">
        {showForm && (
          <QuickTaskForm
            questId={questId}
            parentId={node.id}
            onSave={(p) => {
              setEntries((prev) => [...prev, p]);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
        <div className="text-right">
          <button onClick={handleAddTask} className="text-xs text-accent underline">
            + Add Task
          </button>
        </div>
        <div className="text-sm text-secondary">No log entries.</div>
      </div>
    );

  return (
    <div className="space-y-2">
      {showForm && (
        <QuickTaskForm
          questId={questId}
          parentId={node.id}
          onSave={(p) => {
            setEntries((prev) => [...prev, p]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
      <div className="text-right">
        <button onClick={handleAddTask} className="text-xs text-accent underline">
          + Add Task
        </button>
      </div>
      {entries.map((entry) => {
        const isOpen = !!expanded[entry.id];
        return (
          <div key={entry.id} className="border border-secondary rounded">
            <div
              className="flex justify-between items-center p-2 cursor-pointer bg-background"
              onClick={() => {
                setExpanded((prev) => ({ ...prev, [entry.id]: !isOpen }));
              }}
            >
              <span className="font-semibold text-sm">
                {entry.content.slice(0, 40)}
              </span>
              <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div className="p-2 space-y-2 overflow-auto max-h-60">
                <PostCard post={entry} user={user} questId={questId} />
                <ReplyThread postId={entry.id} user={user} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LogThreadPanel;
