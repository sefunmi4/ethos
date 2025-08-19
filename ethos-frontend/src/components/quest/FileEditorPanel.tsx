import React, { useState } from 'react';
import LineVersionThread from './LineVersionThread';

interface FileEditorPanelProps {
  questId: string;
  filePath: string;
  content: string;
  /** Render a static, non-editable view */
  readOnly?: boolean;
}

const FileEditorPanel: React.FC<FileEditorPanelProps> = ({ questId, filePath, content, readOnly }) => {
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content + '\n');
  const [commitMsg, setCommitMsg] = useState('Update file');
  const lines = content.split('\n');

  const handleSave = () => {
    if (window.confirm('Commit these changes?')) {
      console.log('Save file', filePath, commitMsg, draft);
      setEditing(false);
    }
  };

  if (!readOnly && editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full border border-secondary rounded p-2 font-mono text-sm"
          rows={Math.max(8, draft.split('\n').length + 2)}
        />
        <input
          type="text"
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          className="w-full border border-secondary rounded px-2 py-1 text-sm"
          placeholder="Commit message"
        />
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-accent text-white text-xs px-2 py-1 rounded">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="text-xs underline">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <pre className="relative bg-background p-2 rounded border border-secondary text-sm font-mono overflow-x-auto">
        {lines.map((line, idx) => (
          <div key={idx} className="relative pl-8">
            <span className="absolute left-0 w-6 text-right pr-1 text-secondary select-none">
              {idx + 1}
            </span>
            {line}
            {!readOnly && (
              <>
                <button
                  className="ml-2 text-accent underline text-xs"
                  onClick={() => setExpandedLine(expandedLine === idx + 1 ? null : idx + 1)}
                >
                  {expandedLine === idx + 1 ? 'Hide' : 'History'}
                </button>
                <button
                  className="ml-1 text-accent underline text-xs"
                  onClick={() => {
                    setEditing(true);
                    setDraft(lines.join('\n') + '\n');
                  }}
                >
                  Edit
                </button>
              </>
            )}
            {!readOnly && expandedLine === idx + 1 && (
              <div className="mt-1">
                <LineVersionThread
                  questId={questId}
                  filePath={filePath}
                  lineNumber={idx + 1}
                  onClose={() => setExpandedLine(null)}
                />
              </div>
            )}
          </div>
        ))}
      </pre>
      {!readOnly && (
        <button
          onClick={() => {
            setEditing(true);
            setDraft(content + '\n');
          }}
          className="mt-2 text-accent underline text-sm"
        >
          Edit File
        </button>
      )}
    </div>
  );
};

export default FileEditorPanel;
