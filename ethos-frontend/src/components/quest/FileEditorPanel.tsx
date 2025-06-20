import React, { useState, useEffect } from 'react';
import { FaExpand, FaCompress } from 'react-icons/fa';
import { updateRepoFile, fetchGitDiff } from '../../api/git';
import { addPost } from '../../api/post';
import { useQuest } from '../../hooks/useQuest';
import type { GitCommit } from '../../types/gitTypes';

interface FileEditorPanelProps {
  questId: string;
  filePath: string;
  content: string;
}

const FileEditorPanel: React.FC<FileEditorPanelProps> = ({ questId, filePath, content }) => {
  const [lines, setLines] = useState<string[]>(content.split('\n'));
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<GitCommit[]>([]);
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const { fetchCommitHistory } = useQuest();

  useEffect(() => {
    setLines(content.split('\n'));
  }, [content]);

  const loadHistory = async () => {
    if (!questId || history.length) return;
    try {
      const commits = await fetchCommitHistory(questId);
      setHistory(commits);
    } catch (err) {
      console.error('[FileEditorPanel] failed to load history', err);
    }
  };

  const saveChanges = async (newLines: string[]) => {
    setSaving(true);
    try {
      const newContent = newLines.join('\n');
      await updateRepoFile(questId, filePath, newContent);
      const diff = await fetchGitDiff(questId, filePath);
      await addPost({
        type: 'commit',
        questId,
        content: `Update ${filePath}`,
        commitSummary: `Update ${filePath}`,
        gitDiff: diff.diffMarkdown,
        linkedNodeId: filePath,
        visibility: 'public',
        tags: [],
        collaborators: [],
        linkedItems: [],
      });
    } catch (err) {
      console.error('[FileEditorPanel] save error', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEnter = async (idx: number) => {
    const newLines = [...lines];
    newLines[idx] = draft;
    newLines.splice(idx + 1, 0, '');
    setLines(newLines);
    await saveChanges(newLines);
    setEditingIdx(idx + 1);
    setDraft('');
  };

  const handleBlur = async (idx: number) => {
    if (draft === lines[idx]) {
      setEditingIdx(null);
      return;
    }
    const newLines = [...lines];
    newLines[idx] = draft;
    setLines(newLines);
    await saveChanges(newLines);
    setEditingIdx(null);
  };

  const toggleHistory = async (idx: number) => {
    if (expandedLine === idx) {
      setExpandedLine(null);
    } else {
      setExpandedLine(idx);
      await loadHistory();
    }
  };

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <span className="text-secondary select-none w-8 text-right">{idx + 1}</span>
          {editingIdx === idx ? (
            <input
              className="flex-1 text-sm font-mono border border-secondary rounded px-1 py-0.5"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEnter(idx);
                }
              }}
              onBlur={() => handleBlur(idx)}
            />
          ) : (
            <div
              className="flex-1 text-sm font-mono cursor-text"
              onDoubleClick={() => {
                setEditingIdx(idx);
                setDraft(line);
              }}
            >
              {line || '\u00A0'}
            </div>
          )}
          <button
            className="text-xs text-accent ml-1 mt-1"
            onClick={() => toggleHistory(idx)}
          >
            {expandedLine === idx ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      ))}
      {expandedLine !== null && history.length > 0 && (
        <div className="ml-12 mt-1 space-y-1 text-xs text-secondary">
          {history.map((c) => (
            <div key={c.id}>
              <span className="font-mono">{c.timestamp.slice(0, 10)}</span>{' '}
              {c.author.username || c.author.id}: {c.message}
            </div>
          ))}
        </div>
      )}
      {saving && <div className="text-xs text-secondary">Saving...</div>}
    </div>
  );
};

export default FileEditorPanel;
