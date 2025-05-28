import React, { useState } from 'react';
import { axiosWithAuth } from '../../utils/authUtils';
import { POST_TYPES } from '../../constants/POST_TYPES';
import { TextArea, Select, Button, Label, FormSection } from '../ui';
import RoleAssignment from '../contribution/controls/RoleAssignment';
import LinkControls from '../contribution/controls/LinkControls';

const EditPost = ({ post, onCancel, onUpdated }) => {
  const [type, setType] = useState(post.type);
  const [content, setContent] = useState(post.content);
  const [linkedQuestNode, setLinkedQuestNode] = useState({
    questId: post.questId || '',
    nodeId: post.nodeId || null,
  });
  const [assignedRoles, setAssignedRoles] = useState(post.assignedRoles || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Optional: validate questId for quest_log or quest_task
    if ((type === 'quest_log' || type === 'quest_task') && !linkedQuestNode?.questId) {
      alert('Please link a quest.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      type,
      content,
      ...(linkedQuestNode?.questId && { questId: linkedQuestNode.questId }),
      ...(linkedQuestNode?.nodeId && { nodeId: linkedQuestNode.nodeId }),
      ...(type === 'quest_task' && { assignedRoles }),
    };

    try {
      const res = await axiosWithAuth.put(`/posts/${post.id}`, payload);
      if (res.status === 200) {
        onUpdated?.(res.data);
      } else {
        console.error('[EditPost] Unexpected status:', res.status);
        alert('Failed to update post.');
      }
    } catch (err) {
      console.error('[EditPost] Error updating post:', err);
      alert('An error occurred while updating the post.');
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
          onChange={(e) => setType(e.target.value)}
          options={POST_TYPES.map(({ value, label }) => ({ value, label }))}
        />

        <Label htmlFor="content">Content</Label>
        <TextArea
          id="content"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Update your post..."
          required
        />
      </FormSection>

      {(type === 'quest_log' || type === 'quest_task') && (
        <FormSection title="Linked Quest">
          <LinkControls
            label="Quest"
            value={linkedQuestNode}
            onChange={setLinkedQuestNode}
            allowCreateNew={false}
            allowNodeSelection
          />
        </FormSection>
      )}

      {type === 'quest_task' && (
        <FormSection title="Assigned Roles">
          <RoleAssignment value={assignedRoles} onChange={setAssignedRoles} />
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