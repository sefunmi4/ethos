// src/components/quest/EditQuest.tsx

import React, { useState } from 'react'; 
import type { FormEvent } from 'react'; 
import { patchQuest } from '../../api/quest';  //TODO: patchQuest
import type { Quest } from '../../types/questTypes';  
import type { CollaberatorRoles } from '../../types/postTypes';
import { useBoardContext } from '../../contexts/BoardContext';
import { Button, Label, TextArea, FormSection, Input } from '../ui';
import LinkControls from '../controls/LinkControls'; 
import CollaberatorControls from '../controls/CollaberatorControls';

/**
 * Props for EditQuest component
 */
interface EditQuestProps {
  quest: Quest;
  onCancel: () => void;
  onSave: (updated: Quest) => void;
  compact?: boolean;
}

/**
 * EditQuest Component
 * - Allows inline or full editing of an existing quest.
 * - `compact` mode restricts fields to title/tags only.
 */
const EditQuest: React.FC<EditQuestProps> = ({
  quest,
  onCancel,
  onSave,
  compact = false,
}) => {
  const [title, setTitle] = useState<string>(quest.title || '');
  const [description, setDescription] = useState<string>(quest.description || '');
  const [tags, setTags] = useState<string[]>(quest.tags || []);
  const [links, setLinks] = useState(quest.linkedPosts || []);
  const [collaberatorRoles, setCollaberatorRoles] = useState<CollaberatorRoles[]>([]);
  const [repoUrl, setRepoUrl] = useState<string>(quest.repoUrl || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { selectedBoard, updateBoardItem } = useBoardContext() || {};

  /**
   * Handle form submission to update quest data
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload: Partial<Quest> = {
      title,
      ...(compact ? {} : { description, tags, links, collaberatorRoles, repoUrl }),
    };

    try {
      const updated = await patchQuest(quest.id, payload);
      if (selectedBoard) {
        updateBoardItem(selectedBoard, updated);
      }
      onSave(updated);
    } catch (error) {
      console.error('[EditQuest] Failed to patch quest:', error);
      alert('Could not update quest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <FormSection title="Quest Title">
        <Label htmlFor="quest-title">Title</Label>
        <TextArea
          id="quest-title"
          rows={2}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter quest title"
          required
        />
      </FormSection>

      {/* Full Editor Fields */}
      {!compact && (
        <>
          {/* Description */}
          <FormSection title="Description">
            <Label htmlFor="quest-description">Description</Label>
            <TextArea
              id="quest-description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the quest objectives, outcomes, or background"
            />
          </FormSection>

          {/* Tags */}
          <FormSection title="Tags">
            <Label htmlFor="quest-tags">Comma-separated Tags</Label>
            <Input
              id="quest-tags"
              type="text"
              value={tags.join(', ')}
              onChange={(e) => setTags(e.target.value.split(',').map((tag) => tag.trim()))}
              placeholder="e.g. frontend, research, collaboration"
            />
          </FormSection>

          {/* Repo URL */}
          <FormSection title="Git Repository (Optional)">
            <Label htmlFor="quest-repo">Repository URL</Label>
            <Input
              id="quest-repo"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/your/repo"
            />
          </FormSection>

          {/* Links */}
          <FormSection title="Linked Projects or Posts">
            <LinkControls
              value={links}
              onChange={setLinks}
              label="Related Items"
              allowCreateNew={false}
            />
          </FormSection>

          {/* Roles */}
          <FormSection title="Assigned Roles">
            <CollaberatorControls value={collaberatorRoles} onChange={setCollaberatorRoles} />
          </FormSection>
        </>
      )}

      {/* Actions */}
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

export default EditQuest;