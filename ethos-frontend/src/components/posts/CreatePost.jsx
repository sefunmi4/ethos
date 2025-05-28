import React, { useState } from 'react';
import { POST_TYPES } from '../../constants/POST_TYPES';
import { Button, TextArea, Select, Label, FormSection } from '../ui';
import RoleAssignment from '../contribution/controls/RoleAssignment';
import LinkControls from '../contribution/controls/LinkControls';
import { axiosWithAuth } from '../../utils/authUtils';
import { useBoardContext } from '../../contexts/BoardContext';

const CreatePost = ({ onSave, onCancel }) => {
  const [type, setType] = useState('free_speech');
  const [content, setContent] = useState('');
  const [linkedQuestNode, setLinkedQuestNode] = useState(null); // { questId, nodeId }
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedBoard } = useBoardContext() || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Validate required questId for quest-based posts
    if ((type === 'quest_log' || type === 'quest_task') && !linkedQuestNode?.questId) {
      alert('Please link a quest.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      type,
      content,
      visibility: 'public',
      boardId: selectedBoard?.id || null,
      ...(linkedQuestNode?.questId && { questId: linkedQuestNode.questId }),
      ...(linkedQuestNode?.nodeId && { nodeId: linkedQuestNode.nodeId }),
      ...(type === 'quest_task' && { assignedRoles }),
    };

    try {
      const res = await axiosWithAuth.post('/posts', payload);
      if (res.status === 201) {
        onSave?.(res.data);
      } else {
        console.error('[CreatePost] Unexpected status:', res.status);
        alert('Unexpected error occurred. Please try again.');
      }
    } catch (err) {
      console.error('[CreatePost] Failed to create post:', err);
      alert('Failed to create post. Check your input or try again later.');
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
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts or progress..."
          required
        />
      </FormSection>

      {(type === 'quest_log' || type === 'quest_task') && (
        <FormSection title="Linked Quest">
          <LinkControls
            label="Quest"
            value={linkedQuestNode}
            onChange={setLinkedQuestNode}
            allowCreateNew
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
          {isSubmitting ? 'Posting...' : 'Create Post'}
        </Button>
      </div>
    </form>
  );
};

export default CreatePost;