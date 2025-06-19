import React from 'react';
import MarkdownRenderer from '../ui/MarkdownRenderer';

interface GitDiffViewerProps {
  markdown: string;
}

const GitDiffViewer: React.FC<GitDiffViewerProps> = ({ markdown }) => {
  return (
    <div className="border rounded bg-gray-50 dark:bg-gray-800 p-2 text-sm overflow-x-auto">
      <MarkdownRenderer content={markdown} />
    </div>
  );
};

export default GitDiffViewer;
