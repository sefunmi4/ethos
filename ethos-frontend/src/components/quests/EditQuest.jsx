import React, { useState, useEffect } from 'react';
import { TextArea, Button, Label, FormSection, Input } from '../ui';
import RoleAssignment from '../contribution/RoleAssignment';
import { axiosWithAuth } from '../../utils/authUtils';

const EditQuest = ({ quest, onSave, onCancel }) => {
  const [content, setContent] = useState(quest.content || '');
  const [assignedRoles, setAssignedRoles] = useState(quest.assignedRoles || []);
  const [title, setTitle] = useState(quest.title || '');
  const [tags, setTags] = useState(quest.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setContent(quest.content || '');
    setAssignedRoles(quest.assignedRoles || []);
    setTitle(quest.title || '');
    setTags(quest.tags || []);
  }, [quest]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = {
        ...quest,
        title,
        content,
        assignedRoles,
        tags,
      };
      const res = await axiosWithAuth.patch(`/quests/${quest.id}`, updated);
      onSave?.(res.data);
    } catch (err) {
      console.error('Failed to save quest:', err);
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

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-6">
      <FormSection title="Edit Quest Log">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quest Title"
          required
        />
        <Label>Content</Label>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Edit the quest log..."
          rows={6}
        />
      </FormSection>

      <FormSection title="Assigned Roles">
        <RoleAssignment value={assignedRoles} onChange={setAssignedRoles} />
      </FormSection>

      <FormSection title="Tags">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded cursor-pointer"
              onClick={() => removeTag(tag)}
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
