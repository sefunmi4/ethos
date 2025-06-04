// src/components/post/EditPost.tsx

import React, { useState, FormEvent } from 'react';
import { patchPost } from '../../api/posts';
import { useBoardContext } from '../../contexts/BoardContext';
import { PostType, Post, RoleAssignmentType, LinkItem } from '../../types/postTypes'; //TODO: postTypes PostType, Post, RoleAssignmentType, LinkItem
import { QuestNodeLink } from '../../types/questTypes'; //TODO: QuestNodeLink

import { TextArea, Select, Button, Label, FormSection } from '../ui';
import LinkControls from '../controls/LinkControls'; //TODO: LinkControls
import RoleAssignment from '../controls/RoleAssignment'; //TODO: RoleAssignment

// Define the expected props for the component
interface EditPostProps {
  post: Post;
  onCancel: () => void;
  onUpdated?: (updatedPost: Post) => void;
}

/**
 * EditPost Component
 * Allows users to edit an existing post with support for markdown, quest/task metadata,
 * reactions, reposting, and modular link connections.
 */
const EditPost: React.FC<EditPostProps> = ({ post, onCancel, onUpdated }) => {
  const [type, setType] = useState<PostType>(post.type);
  const [content, setContent] = useState<string>(post.content || '');
  const [linkedQuestNode, setLinkedQuestNode] = useState<QuestNodeLink>({
    questId: post.questId || '',
    nodeId: post.nodeId || null,
  });
  const [assignedRoles, setAssignedRoles] = useState<RoleAssignmentType[]>(post.collaborators || []);
  const [links, setLinks] = useState<LinkItem[]>(post.linkedItems || []);
  const [repostedFrom] = useState(post.repostedFrom || null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { selectedBoard, updateBoardItem } = useBoardContext() || {};

  /**
   * Handles submission of the edited post.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Ensure quest linkage is valid if needed
    if ((type === 'quest') && !linkedQuestNode?.questId) {
      alert('Please link a quest.');
      setIsSubmitting(false);
      return;
    }

    // Construct payload with required fields
    const payload: Partial<Post> = {
      type,
      content,
      ...(linkedQuestNode?.questId && { questId: linkedQuestNode.questId }),
      ...(linkedQuestNode?.nodeId && { nodeId: linkedQuestNode.nodeId }),
      ...(type === 'quest' && { assignedRoles }),
      links: links.map((l) => ({ id: l.id, type: l.type })),
      repostedFrom: repostedFrom || null,
    };

    try {
      const updatedPost = await patchPost(post.id, payload);

      if (selectedBoard) {
        updateBoardItem(selectedBoard, updatedPost);
      }

      if (onUpdated) onUpdated(updatedPost);
    } catch (error) {
      console.error('[EditPost] Failed to update post:', error);
      alert('Failed to update post. Please try again later.');
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
          onChange={(e) => setType(e.target.value as PostType)}
          options={[
            { value: 'free_speech', label: 'Free Speech' },
            { value: 'request', label: 'Request' },
            { value: 'review', label: 'Review' },
            { value: 'quest_log', label: 'Quest Log' },
            { value: 'quest_task', label: 'Quest Task' },
          ]}
        />

        <Label htmlFor="content">Content (Markdown supported)</Label>
        <TextArea
          id="content"
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post..."
          required
        />
      </FormSection>

      {(type === 'quest') && (
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

      {type === 'quest' && (
        <FormSection title="Assigned Roles">
          <RoleAssignment value={assignedRoles} onChange={setAssignedRoles} />
        </FormSection>
      )}

      <FormSection title="Linked Items">
        <LinkControls
          label="Link to quests/projects"
          value={null}
          onChange={(newLink: LinkItem) => setLinks([...links, newLink])}
          allowCreateNew={false}
        />
        {links.length > 0 && (
          <ul className="list-disc pl-6 mt-2 text-sm text-blue-700">
            {links.map((l, idx) => (
              <li key={idx}>
                {l.type}: {l.title || l.id}
                <button
                  type="button"
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
            Originally posted by <strong>@{repostedFrom.username}</strong>
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