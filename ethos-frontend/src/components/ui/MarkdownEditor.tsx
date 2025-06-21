import React, { useState } from 'react';
import TextArea from './TextArea';
import MarkdownRenderer from './MarkdownRenderer';

interface MarkdownEditorProps {
  id?: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  id,
  value,
  placeholder = '',
  rows = 6,
  onChange,
}) => {
  const [preview, setPreview] = useState(false);

  const applyWrap = (start: string, end: string = start) => {
    const ta = document.getElementById(id || '') as HTMLTextAreaElement | null;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd);
    const after = value.slice(selectionEnd);
    const newVal = before + start + selected + end + after;
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = selectionStart + start.length;
      ta.selectionEnd = selectionEnd + start.length;
    });
  };

  const applyPrefix = (prefix: string) => {
    const ta = document.getElementById(id || '') as HTMLTextAreaElement | null;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd) || '';
    const after = value.slice(selectionEnd);
    const lines = selected.split('\n');
    const newLines = lines.map(line => prefix + line);
    const newVal = before + newLines.join('\n') + after;
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = selectionStart;
      ta.selectionEnd = selectionEnd + prefix.length * lines.length;
    });
  };

  const applyCodeBlock = () => {
    const lang = prompt('Language for code block?') || '';
    const ta = document.getElementById(id || '') as HTMLTextAreaElement | null;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd);
    const after = value.slice(selectionEnd);
    const newVal = `${before}\n\`\`\`${lang}\n${selected}\n\`\`\`\n${after}`;
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = selectionStart + 4;
      ta.selectionEnd = selectionStart + 4 + lang.length;
    });
  };

  return (
    <div>
      <div className="flex gap-2 mb-1 text-sm">
        <button type="button" className="px-1" onClick={() => applyWrap('**')}>
          <strong>B</strong>
        </button>
        <button type="button" className="px-1" onClick={() => applyWrap('*')}>
          <em>I</em>
        </button>
        <button type="button" className="px-1" onClick={() => applyWrap('`')}>
          {'`</>`'}
        </button>
        <button type="button" className="px-1" onClick={() => applyWrap('[', '](url)')}>
          link
        </button>
        <button type="button" className="px-1" onClick={() => applyWrap('## ')}>
          H
        </button>
        <button type="button" className="px-1" onClick={() => applyPrefix('- [ ] ')}>
          ✓
        </button>
        <button type="button" className="px-1" onClick={() => applyPrefix('- ')}>
          •
        </button>
        <button type="button" className="px-1" onClick={() => applyPrefix('1. ')}>
          1.
        </button>
        <button type="button" className="px-1" onClick={applyCodeBlock}>
          code
        </button>
        <button
          type="button"
          className="ml-auto underline"
          onClick={() => setPreview((p) => !p)}
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {preview ? (
        <div className="border rounded p-2">
          <MarkdownRenderer content={value} />
        </div>
      ) : (
        <TextArea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      )}
    </div>
  );
};

export default MarkdownEditor;
