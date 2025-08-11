// src/components/post/EditPost.tsx

import React, { useState } from 'react';
import type { FormEvent } from 'react';
import MarkdownRenderer from '../ui/MarkdownRenderer';

import { updatePost } from '../../api/post';
import { POST_TYPES, STATUS_OPTIONS } from '../../constants/options';
import { useBoardContext } from '../../contexts/BoardContext';
import type { BoardItem } from '../../contexts/BoardContextTypes';
import type { PostType, Post, LinkedItem } from '../../types/postTypes';

import { Select, Button, Label, FormSection, Input, MarkdownEditor } from '../ui';
import LinkControls from '../controls/LinkControls';

interface EditPostProps {
  post: Post;
  onCancel: () => void;
  onUpdated?: (updatedPost: Post) => void;
}

const EditPost: React.FC<EditPostProps> = ({ post, onCancel, onUpdated }) => {
  const [type, setType] = useState<PostType>(post.type);
  const [status, setStatus] = useState<string>(post.status || 'To Do');
  const [title, setTitle] = useState<string>(post.title || '');
  const [content, setContent] = useState<string>(post.content || '');
  const [details, setDetails] = useState<string>(post.details || '');
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>(post.linkedItems || []);
  const [repostedFrom] = useState(post.repostedFrom || null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const { selectedBoard, updateBoardItem } = useBoardContext() || {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload: Partial<Post> = {
      type,
      title: type === 'task' ? content : title || undefined,
      content,
      ...(type === 'task' && details ? { details } : {}),
      ...(type === 'task'
        ? { status }
        : {}),
      linkedItems,
      repostedFrom: repostedFrom || null,
    };

    try {
      const updatedPost = await updatePost(post.id, payload);
      if (selectedBoard) updateBoardItem(selectedBoard, updatedPost as BoardItem);
      if (onUpdated) onUpdated(updatedPost);
    } catch (error) {
      console.error('[EditPost] Failed to update post:', error);
      alert('Failed to update post. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Post Details">
        <Label htmlFor="post-type">Post Type</Label>
        <Select
          id="post-type"
          value={type}
          onChange={(e) => {
            const val = e.target.value as PostType;
            setType(val);
            if (val === 'task') setStatus('To Do');
          }}
          options={POST_TYPES.map(({ value, label }) => ({ value, label }))}
        />

        {type === 'task' && (
          <>
            <Label htmlFor="task-status">Status</Label>
            <Select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
            />
          </>
        )}

        {type !== 'task' && (
          <>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required={type !== 'free_speech'}
            />
          </>
        )}

        {type === 'task' ? (
          <>
            <Label htmlFor="content">Task Title</Label>
            <Input
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Short task summary"
              required
            />
            <Label htmlFor="details">Details</Label>
            <MarkdownEditor
              id="details"
              value={details}
              onChange={setDetails}
              placeholder="Additional information"
            />
          </>
        ) : (
          <>
            <Label htmlFor="content">Content</Label>
            <MarkdownEditor
              id="content"
              value={content}
              onChange={setContent}
              placeholder="Write your post..."
            />
          </>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="text-accent text-sm underline"
          >
            {showPreview ? 'Hide Markdown Preview' : 'Show Markdown Preview'}
          </button>

            {showPreview && (
              <div className="mt-2 border rounded p-3 bg-background text-sm prose max-w-none">
                <MarkdownRenderer content={content} />
              </div>
            )}
        </div>
      </FormSection>

      {showLinkControls(type) && (
        <FormSection title="Linked Items">
          <LinkControls
            label="Item"
            value={linkedItems}
            onChange={(newLinks: LinkedItem[]) => setLinkedItems(newLinks)}
            allowCreateNew={false}
            itemTypes={['quest', 'post']}
          />
          {linkedItems.length > 0 && (
            <ul className="list-disc pl-6 mt-2 text-sm text-accent">
              {linkedItems.map((l, idx) => (
                <li key={idx}>
                  {l.itemType}: {l.title || l.nodeId}
                  <button
                    type="button"
                    className="text-error ml-2 text-xs hover:underline"
                    onClick={() =>
                      setLinkedItems(linkedItems.filter((_, i) => i !== idx))
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FormSection>
      )}

      {repostedFrom && (
        <FormSection title="Reposted From">
          <div className="text-sm text-secondary italic">
            Originally posted by <strong>@{repostedFrom.username}</strong>
          </div>
        </FormSection>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default EditPost;

function showLinkControls(type: PostType): boolean {
  return ['request', 'task', 'change', 'review'].includes(type);
}