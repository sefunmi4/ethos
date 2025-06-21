import React, { useState } from 'react';
import LineVersionThread from './LineVersionThread';

interface FileEditorPanelProps {
  questId: string;
  filePath: string;
  content: string;
}

const FileEditorPanel: React.FC<FileEditorPanelProps> = ({ questId, filePath, content }) => {
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const lines = content.split('\n');

  return (
    <pre className="relative bg-background p-2 rounded border border-secondary text-sm font-mono overflow-x-auto">
      {lines.map((line, idx) => (
        <div key={idx} className="relative pl-8">
          <span className="absolute left-0 w-6 text-right pr-1 text-secondary select-none">
            {idx + 1}
          </span>
          {line}
          <button
            className="ml-2 text-accent underline text-xs"
            onClick={() => setExpandedLine(expandedLine === idx + 1 ? null : idx + 1)}
          >
            {expandedLine === idx + 1 ? 'Hide' : 'History'}
          </button>
          {expandedLine === idx + 1 && (
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
  );
};

export default FileEditorPanel;
