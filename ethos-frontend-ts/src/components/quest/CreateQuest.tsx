import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuest } from '../../api/quest'; //TODO: createQuest quest
import { Button, Input, TextArea, Label, FormSection } from '../ui';
import CollaberatorControls from '../controls/CollaberatorControls';

import type { Quest } from '../../types/questTypes';
import type { Post, CollaberatorRoles} from '../../types/postTypes';

/**
 * Payload shape for creating a new quest
 */
type CreateQuestPayload = {
  title: string;
  description: string;
  tags: string[];
  repoUrl?: string;
  collaberatorRoles: CollaberatorRoles[];
  fromPostId?: string;
};

/**
 * Props for CreateQuest component
 */
type CreateQuestProps = {
  onSave?: (quest: Quest) => void;
  onCancel: () => void;
  mode?: 'inline' | 'modal';
  fromPost?: Post | null;
};

/**
 * CreateQuest Component
 * - Form to create a new quest.
 * - Can be used inline or in a modal.
 */
const CreateQuest: React.FC<CreateQuestProps> = ({
  onSave,
  onCancel,
  mode = 'inline',
  fromPost = null
}) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState(fromPost?.content?.slice(0, 80) || '');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [collaberatorRoles, setCollaberatorRoles] = useState<CollaberatorRoles[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles quest creation and optional redirect or inline save.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const payload: CreateQuestPayload = {
      title: title.trim(),
      description: description.trim(),
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      repoUrl: repoUrl.trim() || undefined,
      collaberatorRoles,
      fromPostId: fromPost?.id,
    };

    try {
      const newQuest = await createQuest(payload);
      onSave?.(newQuest);

      if (mode === 'modal') {
        navigate(`/quest/${newQuest.id}`);
      }
    } catch (error) {
      console.error('[CreateQuest] Failed to create quest:', error);
      alert('Failed to create quest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Quest Details">
        <Label htmlFor="quest-title">Title</Label>
        <Input
          id="quest-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter quest title"
          required
        />

        <Label htmlFor="quest-description">Description</Label>
        <TextArea
          id="quest-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the goal, challenge, or mission"
        />

        <Label htmlFor="quest-tags">Tags</Label>
        <Input
          id="quest-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. bugfix, collab, frontend"
        />

        <Label htmlFor="repo-link">GitHub Repo (optional)</Label>
        <Input
          id="repo-link"
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/your/project"
        />
      </FormSection>

      <FormSection title="Assign Roles (optional)">
        <CollaberatorControls value={collaberatorRoles} onChange={setCollaberatorRoles} />
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Quest'}
        </Button>
      </div>
    </form>
  );
};

export default CreateQuest;