import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addQuest } from '../../api/quest';
import { updateBoard } from '../../api/board';
import { useBoardContext } from '../../contexts/BoardContext';
import type { BoardItem } from '../../contexts/BoardContextTypes';
import { Button, Input, TextArea, Label, FormSection } from '../ui';
import CollaberatorControls from '../controls/CollaberatorControls';
import { useSyncGitRepo } from '../../hooks/useGit';

import type { Quest } from '../../types/questTypes';
import type { Post, CollaberatorRoles } from '../../types/postTypes';

type CreateQuestPayload = {
  title: string;
  description: string;
  tags: string[];
  repoUrl?: string;
  collaberatorRoles: CollaberatorRoles[];
  fromPostId?: string;
  helpRequest?: boolean;
};

type CreateQuestProps = {
  onSave?: (quest: Quest) => void;
  onCancel: () => void;
  mode?: 'inline' | 'modal';
  fromPost?: Post | null;
  boardId?: string;
};

const CreateQuest: React.FC<CreateQuestProps> = ({
  onSave,
  onCancel,
  mode = 'inline',
  fromPost = null,
  boardId,
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState(fromPost?.content?.slice(0, 80) || '');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [collaberatorRoles, setCollaberatorRoles] = useState<CollaberatorRoles[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncRepo, setSyncRepo] = useState(true); // default checked
  const [helpRequest, setHelpRequest] = useState(boardId === 'quest-board');

  const syncGit = useSyncGitRepo();
  const { selectedBoard, appendToBoard, boards } = useBoardContext() || {};

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
      helpRequest: helpRequest || undefined,
    };

    try {
      const newQuest = await addQuest(payload);

      if (repoUrl && syncRepo) {
        await syncGit.mutateAsync(newQuest.id);
      }

      if (selectedBoard) {
        appendToBoard(selectedBoard, newQuest as BoardItem);
        const items = [newQuest.id, ...(boards?.[selectedBoard]?.items || [])];
        updateBoard(selectedBoard, { items }).catch((err) =>
          console.error('[CreateQuest] Failed to persist board items:', err)
        );
      }
      if (boards?.['my-quests'] && selectedBoard !== 'my-quests') {
        appendToBoard('my-quests', newQuest as BoardItem);
        const myItems = [newQuest.id, ...(boards['my-quests'].items || [])];
        updateBoard('my-quests', { items: myItems }).catch((err) =>
          console.error('[CreateQuest] Failed to update my-quests board:', err)
        );
      }

      onSave?.(newQuest);
      if (mode === 'modal') navigate(`/quest/${newQuest.id}`);
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

        {repoUrl && (
          <label className="inline-flex items-center mt-2 space-x-2">
            <input
              type="checkbox"
              checked={syncRepo}
              onChange={(e) => setSyncRepo(e.target.checked)}
              className="form-checkbox"
            />
            <span>Initialize Git sync on create</span>
          </label>
        )}

        {(boardId || selectedBoard) === 'quest-board' && (
          <label className="inline-flex items-center mt-2 space-x-2">
            <input
              type="checkbox"
              checked={helpRequest}
              onChange={(e) => setHelpRequest(e.target.checked)}
              className="form-checkbox"
            />
            <span>Ask for help</span>
          </label>
        )}
      </FormSection>

      <FormSection title="Assign Roles (optional)">
        <CollaberatorControls value={collaberatorRoles} onChange={setCollaberatorRoles} />
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contrast" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Quest'}
        </Button>
      </div>
    </form>
  );
};

export default CreateQuest;