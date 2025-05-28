import React, { useState } from 'react';
import { axiosWithAuth } from '../../utils/authUtils';
import { POST_TYPES } from '../../constants/POST_TYPES';
import TextArea from '../ui/TextArea';
import Select from '..//ui/Select';
import Button from '../ui/Button';
import RoleAssignment from '../contribution/controls/RoleAssignment';
import LinkControls from '../contribution/controls/LinkControls';

const EditPost = ({ post, onCancel, onUpdated }) => {
  const [type, setType] = useState(post.type);
  const [content, setContent] = useState(post.content);
  const [linkedQuest, setLinkedQuest] = useState(post.questId || '');
  const [assignedRoles, setAssignedRoles] = useState(post.assignedRoles || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      type,
      content,
      questId: linkedQuest || null,
      assignedRoles: type === 'quest_task' ? assignedRoles : [],
    };

    try {
      const res = await axiosWithAuth.patch(`/posts/${post.id}`, payload);
      if (res.status === 200) {
        onUpdated?.(res.data);
      }
    } catch (err) {
      console.error('[EditPost] Failed to update post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Post Type</label>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          {POST_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Content</label>
        <TextArea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Update your post..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Linked Quest</label>
        <LinkControls
          value={linkedQuest}
          onChange={setLinkedQuest}
          allowCreateNew={false}
        />
      </div>

      {type === 'quest_task' && (
        <RoleAssignment
          value={assignedRoles}
          onChange={setAssignedRoles}
        />
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