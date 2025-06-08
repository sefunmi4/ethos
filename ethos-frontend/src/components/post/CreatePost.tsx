import React, { useState } from 'react';
import { POST_TYPES } from '../../constants/options';
import { addPost } from '../../api/post';
import { Button, TextArea, Select, Label, FormSection } from '../ui';
import CollaberatorControls from '../controls/CollaberatorControls';
import LinkControls from '../controls/LinkControls';
import CreateQuest from '../quest/CreateQuest';
import { useBoardContext } from '../../contexts/BoardContext';
import type { Post, PostType, LinkedItem, CollaberatorRoles } from '../../types/postTypes';

type CreatePostProps = {
  onSave?: (post: Post) => void;
  onCancel: () => void;
  replyTo?: Post | null;
  repostSource?: Post | null;
};

const CreatePost: React.FC<CreatePostProps> = ({ onSave, onCancel, replyTo = null, repostSource = null }) => {
  const [type, setType] = useState<PostType>('free_speech');
  const [content, setContent] = useState<string>('');
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [collaborators, setCollaborators] = useState<CollaberatorRoles[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selectedBoard, appendToBoard } = useBoardContext() || {};

  if (type === 'quest') {
    return (
      <CreateQuest
        onSave={(q) => onSave?.(q as any)}
        onCancel={onCancel}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Check for quest linkage if required
    if (requiresQuestLink(type)) {
      const hasQuest = linkedItems.some((item) => item.itemType === 'quest');
      if (!hasQuest) {
        alert('Please link a quest before submitting.');
        setIsSubmitting(false);
        return;
      }
    }

    const payload: Partial<Post> = {
      type,
      content,
      visibility: 'public',
      linkedItems,
      ...(selectedBoard ? { boardId: selectedBoard } : {}),
      ...(replyTo ? { replyTo: replyTo.id, parentPostId: replyTo.id, linkType: 'reply' } : {}),
      ...(repostSource
        ? {
            parentPostId: repostSource.id,
            linkType: 'repost',
            repostedFrom: {
              originalPostId: repostSource.id,
              username: repostSource.author?.username,
              originalContent: repostSource.content,
              originalTimestamp: repostSource.timestamp,
            },
          }
        : {}),
      ...(requiresQuestRoles(type) && { collaborators }),
    };

    try {
      const newPost = await addPost(payload);
      if (selectedBoard) appendToBoard(selectedBoard, newPost);
      onSave?.(newPost);
    } catch (err) {
      console.error('[CreatePost] Error creating post:', err);
      alert('Failed to create post. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Post Details">
        {!replyTo && !repostSource && (
          <>
            <Label htmlFor="post-type">Post Type</Label>
            <Select
              id="post-type"
              value={type}
              onChange={(e) => setType(e.target.value as PostType)}
              options={POST_TYPES.filter(
                ({ value }) => value !== 'quest' || linkedItems.length === 0
              ).map(({ value, label }) => ({ value, label }))}
            />
          </>
        )}

        <Label htmlFor="content">Content</Label>
        <TextArea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            replyTo
              ? 'Reply to this post...'
              : repostSource
              ? 'Add a comment to your repost...'
              : 'Share your thoughts or progress...'
          }
          required
        />
      </FormSection>

      {requiresQuestLink(type) && !replyTo && (
        <FormSection title="Linked Quest">
          <LinkControls
            label="Quest"
            value={linkedItems}
            onChange={setLinkedItems}
            allowCreateNew
            allowNodeSelection
          />
        </FormSection>
      )}

      {requiresQuestRoles(type) && !replyTo && (
        <FormSection title="Collaborators">
          <CollaberatorControls value={collaborators} onChange={setCollaborators} />
        </FormSection>
      )}

      {repostSource && (
        <FormSection title="Repost Info">
          <p className="text-xs text-gray-600">
            Reposting from <strong>@{repostSource.author?.username || 'anonymous'}</strong>
          </p>
        </FormSection>
      )}

      {replyTo && (
        <FormSection title="Replying To">
          <p className="text-xs text-gray-600">
            Replying to <strong>{replyTo.content?.slice(0, 80) || replyTo.id}</strong>
          </p>
        </FormSection>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Create Post'}
        </Button>
      </div>
    </form>
  );
};

function requiresQuestLink(type: PostType): boolean {
  return ['log', 'task'].includes(type);
}

function requiresQuestRoles(type: PostType): boolean {
  return ['log', 'task'].includes(type);
}

export default CreatePost;