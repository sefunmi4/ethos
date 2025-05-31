import React, { useEffect, useState } from 'react';
import { axiosWithAuth } from '../../utils/authUtils';
import { POST_TYPES } from '../../constants/POST_TYPES';
import { Button, TextArea, Select, Label, FormSection } from '../ui';
import LinkControls from '../contribution/controls/LinkControls';
import RoleAssignment from '../contribution/controls/RoleAssignment';

const CreateReplyPost = ({ post, onReplySubmit, onCancel, onUpdate }) => {
  const [type, setType] = useState('free_speech');
  const [content, setContent] = useState('');
  const [linkedQuestNode, setLinkedQuestNode] = useState(null);
  const [linkedItems, setLinkedItems] = useState([]);
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [addQuote, setAddQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsLinking = ['quest_log', 'quest_task'].includes(type);

  useEffect(() => {
    if (post?.type && ['quest_log', 'quest_task'].includes(post.type)) {
      const fallback = {
        questId: post.questId,
        nodeId: post.nodeId || null,
      };
      setLinkedQuestNode(fallback);
      setLinkedItems([{ itemType: 'quest', itemId: fallback.questId, nodeId: fallback.nodeId }]);
    }
  }, [post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      type,
      content,
      replyTo: post.id,
      visibility: 'public',
      questId: linkedQuestNode?.questId || null,
      nodeId: linkedQuestNode?.nodeId || null,
      assignedRoles: type === 'quest_task' ? assignedRoles : [],
      linkedItems,
      ...(addQuote && {
        repostedFrom: {
          id: post.author?.id,
          username: post.author?.username || 'unknown',
          originalPostId: post.id,
          originalContent: post.content,
        },
      }),
    };

    try {
      const res = await axiosWithAuth.post('/posts', payload);
      onReplySubmit?.(res.data);

      const updated = await axiosWithAuth.get(`/posts/${post.id}`);
      onUpdate?.(updated.data);

      onCancel?.();
    } catch (err) {
      console.error('[CreateReplyPost] Failed to reply:', err);
      alert('Failed to submit reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4 border-t pt-4 text-sm">
      <FormSection title="Reply Type & Content">
        <Label htmlFor="type">Type</Label>
        <Select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={POST_TYPES.map(({ value, label }) => ({ value, label }))}
        />

        <Label htmlFor="content">Content</Label>
        <TextArea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your reply..."
          required
        />
      </FormSection>

      {needsLinking && (
        <FormSection title="Link to Quest">
          <LinkControls
            label="Quest"
            value={linkedQuestNode}
            onChange={(items) => {
                const questItem = items.find((v) => v.itemType === 'quest');
                if (questItem) {
                  const newNode = {
                    questId: questItem.itemId,
                    nodeId: questItem.nodeId || null,
                  };
                  setLinkedQuestNode(newNode);
                  setLinkedItems([questItem]);
                } else {
                  setLinkedQuestNode(null);
                  setLinkedItems([]);
                }
              }}
            allowCreateNew
            allowNodeSelection
            currentPostId={post.id}
          />
        </FormSection>
      )}

      {type === 'quest_task' && (
        <FormSection title="Assigned Roles">
          <RoleAssignment value={assignedRoles} onChange={setAssignedRoles} />
        </FormSection>
      )}

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={addQuote}
          onChange={(e) => setAddQuote(e.target.checked)}
        />
        Add quote from original post
      </label>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Reply'}
        </Button>
      </div>
    </form>
  );
};

export default CreateReplyPost;