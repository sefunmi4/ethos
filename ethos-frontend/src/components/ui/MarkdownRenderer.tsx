import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;
  return (
    <ReactMarkdown className="prose prose-sm max-w-none">{content}</ReactMarkdown>
  );
};

export default MarkdownRenderer;
