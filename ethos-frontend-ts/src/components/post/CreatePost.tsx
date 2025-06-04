// src/components/post/CreatePost.tsx

import React, { useState } from 'react';
import { POST_TYPES } from '../../constants/options';
import { createPost } from '../../api/posts';   //TODO: posts createPost
import { Button, TextArea, Select, Label, FormSection } from '../ui';
import RoleAssignment from '../controls/RoleAssignment'; //TODO: RoleAssignment
import LinkControls from '../controls/LinkControls'; //TODO: LinkControls
import { useBoardContext } from '../../contexts/BoardContext';
import type { Post, PostType, LinkedItem } from '../../types/postTypes'; 
import { QuestNodeLink, RoleAssignmentData } from '../../types/postTypes'; //TODO: postTypes
// import { isDefined } from '../../utils/displayUtils'; //TODO: Utility type guard

type CreatePostProps = {
  onSave?: (post: Post) => void;
  onCancel: () => void;
  replyTo?: Post | null;
  repostSource?: Post | null;
};

/**
 * CreatePost – Form for composing a new post.
 * Supports free speech, requests, quest logs/tasks, reply and repost semantics.
 */
const CreatePost: React.FC<CreatePostProps> = ({ onSave, onCancel, replyTo = null, repostSource = null }) => {
  const [type, setType] = useState<PostType>('free_speech');
  const [content, setContent] = useState<string>('');
  const [linkedQuestNode, setLinkedQuestNode] = useState<QuestNodeLink | null>(null);
  const [linkedItems, setLinkedItems] = useState<any[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<RoleAssignmentData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selectedBoard, appendToBoard } = useBoardContext() || {};

  /**
   * Handles submission of the post creation form.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    // Ensure quest-type posts have a linked quest
    if (type === 'quest' && !linkedQuestNode?.questId) {
        alert('Please link a quest before submitting.');
        setIsSubmitting(false);
        return;
    }

    const payload: Partial<Post> & {
      type: PostType;
      content: string;
      visibility: 'public';
      boardId?: string | null;
      questId?: string | null;
      nodeId?: string | null;
      assignedRoles?: RoleAssignmentData[];
      linkedItems?: any[];
      parentPostId?: string;
      linkType?: 'reply' | 'repost';
      repostedFrom?: { id: string; username?: string; originalPostId: string };
      replyTo?: string | null;
    } = {
      type,
      content,
      visibility: 'public',
      boardId: selectedBoard || null,
      questId: linkedQuestNode?.questId || null,
      nodeId: linkedQuestNode?.nodeId || null,
      assignedRoles: type === 'quest' ? assignedRoles : [],
      linkedItems: linkedItems,
      replyTo: replyTo?.id || null,
    };

    if (replyTo) {
      payload.parentPostId = replyTo.id;
      payload.linkType = 'reply';
    }

    if (repostSource) {
      payload.parentPostId = repostSource.id;
      payload.linkType = 'repost';
      payload.repostedFrom = {
        id: repostSource.author?.id || '',
        username: repostSource.author?.username,
        originalPostId: repostSource.id,
        originalContent: repostSource.content,
        originalTimestamp: repostSource.timestamp,
      };
    }

    try {
      const newPost = await createPost(payload);
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
                options={POST_TYPES.map(({ value, label }) => ({ value, label }))}
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

      {requiresQuestType(type) && (
        <FormSection title="Linked Quest">
            <LinkControls
            label="Quest"
            value={linkedItems}
            onChange={(items: LinkedItem[]) => {
                const quest = items.find((i) => i.itemType === 'quest');
                if (quest) {
                setLinkedQuestNode({ questId: quest.itemId, nodeId: quest.nodeId || null });
                setLinkedItems([quest]);
                } else {
                setLinkedQuestNode(null);
                setLinkedItems([]);
                }
            }}
            allowCreateNew
            allowNodeSelection
            />
        </FormSection>
      )}

      {type === 'quest' && (
        <FormSection title="Assigned Roles">
          <RoleAssignment value={assignedRoles} onChange={setAssignedRoles} />
        </FormSection>
      )}

      {repostSource && (
        <FormSection title="Repost Info">
          <p className="text-xs text-gray-600">
            Reposting from <strong>@{repostSource.authorId || 'anonymous'}</strong>
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

/**
 * Helper function to determine if post type requires quest linkage.
 */
function requiresQuestType(type: PostType): boolean {
  return type === 'quest';
}

export default CreatePost;