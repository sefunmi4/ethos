import React, { useState } from 'react';
import { useGitFileTree } from '../../hooks/useGit';
import { createRepoFile, updateRepoFile, fetchGitDiff } from '../../api/git';
import { addPost } from '../../api/post';
import type { GitFile } from '../../types/gitTypes';
import { TextArea, Input, Button } from '../ui';

interface GitFileBrowserProps {
  questId: string;
  onClose: () => void;
}

const GitFileBrowser: React.FC<GitFileBrowserProps> = ({ questId, onClose }) => {
  const { data: tree, isLoading } = useGitFileTree(questId);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [editingFile, setEditingFile] = useState<GitFile | null>(null);
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('Commit change');
  const [issueId, setIssueId] = useState('');
  const [saving, setSaving] = useState(false);

  const files = (tree || []).filter((f) => f.path.startsWith(currentPath));
  const items = files
    .filter((f) => {
      const rest = f.path.slice(currentPath.length).split('/').filter(Boolean);
      return rest.length === 1;
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const handleOpen = (f: GitFile) => {
    if (f.type === 'folder') {
      setCurrentPath(f.path.endsWith('/') ? f.path : f.path + '/');
    } else {
      setEditingFile(f);
      setContent('');
      setMessage('Commit change');
      }
  };

  const handleSave = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      const existing = tree?.some((f) => f.path === editingFile.path);
      if (existing) {
        await updateRepoFile(questId, editingFile.path, content);
      } else {
        await createRepoFile(questId, editingFile.path, content);
      }
      const diff = await fetchGitDiff(questId, editingFile.path);
      const commitMsg = message || `Update ${editingFile.path}`;
      await addPost({
        type: 'commit',
        questId,
        content: issueId ? `${commitMsg} (Issue #${issueId})` : commitMsg,
        commitSummary: issueId ? `${commitMsg} (Issue #${issueId})` : commitMsg,
        gitDiff: diff.diffMarkdown,
        linkedNodeId: editingFile.path,
        ...(issueId ? { issueId } : {}),
        visibility: 'public',
        tags: [],
        collaborators: [],
        linkedItems: [],
      });
      setEditingFile(null);
    } catch (err) {
      console.error('[GitFileBrowser] save error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface p-4 rounded w-96 max-h-full overflow-auto">
        {editingFile ? (
          <div className="space-y-2">
            <div className="font-semibold">{editingFile.path}</div>
            <Input
              value={issueId}
              onChange={(e) => setIssueId(e.target.value)}
              placeholder="Issue ID"
            />
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Commit message"
            />
            <TextArea rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Commit Change'}
              </Button>
              <Button variant="ghost" onClick={() => setEditingFile(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex justify-between items-center">
              <div className="font-semibold">{currentPath || 'root'}</div>
              {currentPath && (
                <button
                  className="text-accent underline text-xs"
                  onClick={() => setCurrentPath(currentPath.replace(/[^/]+\/?$/, ''))}
                >
                  Back
                </button>
              )}
            </div>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <ul className="space-y-1">
                {items.map((f) => (
                  <li key={f.path}>
                    <button
                      className="text-accent underline text-sm"
                      onClick={() => handleOpen(f)}
                    >
                      {f.type === 'folder' ? '📁' : '📄'} {f.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GitFileBrowser;
