// src/components/posts/EditPost.jsx
import React, { useState } from 'react';
import { axiosWithAuth } from '../../utils/authUtils';
import { POST_TYPES } from '../../constants/POST_TYPES';
import { TextArea, Select, Button, Label, FormSection } from '../ui';
import RoleAssignment from '../contribution/controls/RoleAssignment';
import LinkControls from '../contribution/controls/LinkControls';
import { useBoardContext } from '../../contexts/BoardContext';

const EditPost = ({ post, onCancel, onUpdated }) => {
  const [type, setType] = useState(post.type);
  const [content, setContent] = useState(post.content);
  const [linkedQuestNode, setLinkedQuestNode] = useState({
    questId: post.questId || '',
    nodeId: post.nodeId || null,
  });
  const [assignedRoles, setAssignedRoles] = useState(post.assignedRoles || []);
  const [links, setLinks] = useState(post.links || []);
  const [repostedFrom, setRepostedFrom] = useState(post.repostedFrom || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selectedBoard, updateBoardItem } = useBoardContext() || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

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
      links: links.map((l) => ({ id: l.id, type: l.type })),
      repostedFrom: repostedFrom?.id || null
    };

    try {
      const res = await axiosWithAuth.put(`/posts/${post.id}`, payload);
      if (res.status === 200) {
        const updatedPost = res.data;
        if (selectedBoard?.id) {
          updateBoardItem(selectedBoard.id, updatedPost);
        }
        onUpdated?.(updatedPost);
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

      <FormSection title="Linked Items">
        <LinkControls
          label="Link to quests/projects"
          value={null}
          onChange={(newLink) => setLinks([...links, newLink])}
          allowCreateNew={false}
        />

        {links.length > 0 && (
          <ul className="text-sm text-blue-700 list-disc pl-6 mt-2">
            {links.map((l, idx) => (
              <li key={idx}>
                {l.type}: {l.title || l.id}{' '}
                <button
                  className="text-red-500 ml-2 text-xs hover:underline"
                  onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      {repostedFrom && (
        <FormSection title="Reposted From">
          <div className="text-sm text-gray-600 italic">
            This post was originally created by <strong>@{repostedFrom.username}</strong>.
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