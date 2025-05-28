import React, { useState } from 'react';
import { POST_TYPES } from '../../constants/POST_TYPES';
import { Button, Input, TextArea, Select, Label, FormSection } from '../ui';
import RoleAssignment from '../contribution/RoleAssignment';
import CreateQuestInput from '../contribution/CreateQuestInput';
import useCreateItem from '../../hooks/useCreateItem';

const CreatePost = ({ quests = [], onSave, onCancel }) => {
  const [type, setType] = useState('free_speech');
  const [content, setContent] = useState('');
  const [linkedQuest, setLinkedQuest] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPost } = useCreateItem();

  const showCreateQuest = linkedQuest === '__create';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if ((type === 'quest_log' || type === 'quest_task') && !linkedQuest) {
      alert('Please link a quest.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      type,
      content,
      questId: linkedQuest || null,
      assignedRoles: type === 'quest_task' ? assignedRoles : [],
      visibility: 'public',
    };

    try {
      const result = await createPost(payload);
      onSave?.(result);
    } catch (err) {
      console.error('[CreatePost] Failed to create post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuest = (newQuest) => {
    quests.push(newQuest); // May be replaced later with useBoardContext or mutation hook
    setLinkedQuest(newQuest.id);
    setNewQuestTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Post Details">
        <Label htmlFor="post-type">Post Type</Label>
        <Select
          id="post-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={POST_TYPES.map(({ value, label }) => ({
            value,
            label
          }))}
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

      <FormSection title="Linked Quest (Optional)">
        <Select
          value={linkedQuest}
          onChange={(e) => setLinkedQuest(e.target.value)}
          options={[
            { value: '', label: 'None' },
            ...quests.map((q) => ({ value: q.id, label: q.title })),
            { value: '__create', label: '➕ Create new quest' },
          ]}
        />
        {showCreateQuest && (
          <CreateQuestInput
            value={newQuestTitle}
            onChange={setNewQuestTitle}
            onCreate={handleCreateQuest}
          />
        )}
      </FormSection>

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