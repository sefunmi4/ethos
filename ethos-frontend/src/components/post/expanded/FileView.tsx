import React, { useEffect, useRef, useState } from 'react';
import FileEditorPanel from '../../quest/FileEditorPanel';
import { useAuth } from '../../../contexts/AuthContext';
import { updatePost } from '../../../api/post';
import type { Post, EnrichedPost } from '../../../types/postTypes';

export type PostWithExtras = Post & Partial<EnrichedPost>;

interface ViewProps {
  post: PostWithExtras;
  expanded: boolean;
  compact?: boolean;
}

const FileView: React.FC<ViewProps> = ({ post, expanded }) => {
  const { user } = useAuth();
  const canEdit = user?.id === post.authorId || post.collaborators?.some(c => c.userId === user?.id);
  const [content, setContent] = useState(post.content);
  const [draft, setDraft] = useState(post.content);
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const panelStyle = expanded
    ? { height: width * 1.41, overflowY: 'auto' as const }
    : { maxHeight: width * 1.5, overflowY: 'auto' as const };

  const handleEdit = () => {
    setDraft(content);
    setEditing(true);
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 0);
  };

  const handleSave = async () => {
    try {
      const updated = await updatePost(post.id, { content: draft });
      setContent(updated.content);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save file', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      void handleSave();
    }
  };

  return (
    <div className="text-sm text-primary">
      {post.title && <div className="font-semibold mb-2">{post.title}</div>}
      <div ref={containerRef} style={panelStyle}>
        {editing ? (
          <textarea
            ref={textareaRef}
            className="w-full border border-secondary rounded p-2 font-mono text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ height: panelStyle.height ?? panelStyle.maxHeight }}
          />
        ) : (
          <FileEditorPanel
            questId={post.questId || ''}
            filePath={post.gitFilePath || ''}
            content={content}
            readOnly
          />
        )}
      </div>
      {canEdit && !editing && (
        <button className="text-xs underline mt-1" onClick={handleEdit}>
          Edit
        </button>
      )}
    </div>
  );
};

export default FileView;
