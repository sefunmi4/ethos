import React, { useState } from 'react';
import { useGitFileTree } from '../../hooks/useGit';
import { createRepoFile, updateRepoFile, fetchGitDiff, createRepoFolder } from '../../api/git';
import { addPost } from '../../api/post';
import type { GitFile } from '../../types/gitTypes';
import { TextArea, Input, Button } from '../ui';

interface GitFileBrowserInlineProps {
  questId: string;
  onClose?: () => void;
}

const GitFileBrowserInline: React.FC<GitFileBrowserInlineProps> = ({ questId, onClose }) => {
  const { data: tree, isLoading } = useGitFileTree(questId);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [editingFile, setEditingFile] = useState<GitFile | null>(null);
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('Commit change');
  const [issueId, setIssueId] = useState('');
  const [saving, setSaving] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolder, setNewFolder] = useState('');

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
      console.error('[GitFileBrowserInline] save error', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolder) return;
    try {
      await createRepoFolder(questId, currentPath + newFolder);
      setNewFolder('');
      setCreatingFolder(false);
    } catch (err) {
      console.error('[GitFileBrowserInline] create folder error', err);
    }
  };

  return (
    <div className="border border-secondary rounded p-2 space-y-2">
      {editingFile ? (
        <div className="space-y-2">
          <div className="font-semibold">{editingFile.path}</div>
          <Input value={issueId} onChange={(e) => setIssueId(e.target.value)} placeholder="Issue ID" />
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Commit message" />
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
            <div className="space-x-2">
              {currentPath && (
                <button className="text-accent underline text-xs" onClick={() => setCurrentPath(currentPath.replace(/[^/]+\/?$/, ''))}>
                  Back
                </button>
              )}
              {onClose && (
                <button className="text-accent underline text-xs" onClick={onClose}>
                  Close
                </button>
              )}
            </div>
          </div>
          {creatingFolder && (
            <div className="flex gap-2 mb-2">
              <Input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="Folder name" />
              <Button size="sm" onClick={handleCreateFolder}>Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setCreatingFolder(false)}>Cancel</Button>
            </div>
          )}
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <ul className="space-y-1">
                {items.map((f) => (
                  <li key={f.path}>
                    <button className="text-accent underline text-sm" onClick={() => handleOpen(f)}>
                      {f.type === 'folder' ? '📁' : '📄'} {f.name}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-right">
                <button className="text-xs underline" onClick={() => setCreatingFolder(true)}>
                  + New Folder
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GitFileBrowserInline;
