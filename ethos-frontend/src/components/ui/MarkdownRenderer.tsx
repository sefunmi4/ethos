import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';
import cpp from 'highlight.js/lib/languages/cpp';

hljs.registerLanguage('q++', cpp);

interface MarkdownRendererProps {
  content: string;
  onToggleTask?: (index: number, checked: boolean) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onToggleTask }) => {
  if (!content) return null;
  let checkboxIndex = -1;
  const components = {
    input: ({ checked, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
      if (type === 'checkbox') {
        checkboxIndex += 1;
        return (
          <input
            type="checkbox"
            defaultChecked={Boolean(checked)}
            onChange={(e) => onToggleTask?.(checkboxIndex, e.target.checked)}
          />
        );
      }
      return <input type={type} {...props} />;
    },
  };
  useEffect(() => {
    document.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [content]);
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
    </div>

  );
};

export default MarkdownRenderer;
