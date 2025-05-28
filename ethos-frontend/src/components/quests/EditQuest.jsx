import React, { useState, useEffect } from 'react';
import { TextArea, Button, Label, FormSection, Input } from '../ui';
import RoleAssignment from '../contribution/RoleAssignment';
import { axiosWithAuth } from '../../utils/authUtils';

const EditQuest = ({ quest, onSave, onCancel }) => {
  const [title, setTitle] = useState(quest.title || '');
  const [description, setDescription] = useState(quest.description || '');
  const [tags, setTags] = useState(quest.tags || []);
  const [assignedRoles, setAssignedRoles] = useState(quest.assignedRoles || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(quest.title || '');
    setDescription(quest.description || '');
    setTags(quest.tags || []);
    setAssignedRoles(quest.assignedRoles || []);
  }, [quest]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedQuest = {
        title,
        description,
        tags,
        assignedRoles,
        status: quest.status || 'active',
      };

      const res = await axiosWithAuth.patch(`/quests/${quest.id}`, updatedQuest);
      onSave?.(res.data);
    } catch (err) {
      console.error('[EditQuest] Failed to update quest:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      <FormSection title="Edit Quest">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quest Title"
          required
        />

        <Label>Description</Label>
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this quest about?"
          rows={6}
        />
      </FormSection>

      <FormSection title="Assigned Roles">
        <RoleAssignment value={assignedRoles} onChange={setAssignedRoles} />
      </FormSection>

      <FormSection title="Tags">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span
              key={tag}
              onClick={() => removeTag(tag)}
              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded cursor-pointer"
            >
              #{tag} ✕
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tag"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" variant="secondary" onClick={addTag}>+ Add</Button>
        </div>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default EditQuest;