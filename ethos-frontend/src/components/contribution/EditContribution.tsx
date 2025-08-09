import React, { useState } from 'react';

import EditPost from '../post/EditPost';
import EditQuest from '../quest/EditQuest';
import Select from '../ui/Select';
import { FormSection, Label } from '../ui';

import type { Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';
import type { BoardData } from '../../types/boardTypes';

type ContributionType = 'post' | 'quest';

export interface EditContributionProps {
  /** Existing item to edit */
  item: Post | Quest;

  /** Callback when the form is saved successfully */
  onSave: (updatedItem: Post | Quest) => void | Promise<void>;

  /** Callback when editing is canceled */
  onCancel: () => void;

  /** Optional list of related boards (for context in some editors) */
  boards?: BoardData[];

  /** Optional list of related quests (for linking / metadata) */
  quests?: Quest[];

  /** If true, contribution type is locked and cannot be changed */
  typeOverride?: ContributionType | null;
}

/**
 * EditContribution
 *
 * Dynamically renders the correct editor form for a given contribution (Post, Quest).
 * Used when editing an existing post or quest.
 *
 * @param item - The original contribution to edit
 * @param onSave - Callback on successful edit
 * @param onCancel - Callback on cancel
 * @param boards - Optional board list
 * @param quests - Optional quest list for linking
 * @param typeOverride - Lock form to specific type (if set)
 */
const EditContribution: React.FC<EditContributionProps> = ({
  item,
  onSave,
  onCancel,
  boards = [],
  quests = [],
  typeOverride = null,
}) => {
  const initialType = typeOverride || ('type' in item ? (item.type as ContributionType) : 'post');
  const [type, setType] = useState<ContributionType>(initialType);

  const sharedProps = {
    onSave,
    onCancel,
    boards,
    quests,
  };

  const renderEditor = () => {
    switch (type) {
      case 'post':
        return <EditPost {...sharedProps} post={item as Post} />;
      case 'quest':
        return <EditQuest {...sharedProps} quest={item as Quest} />;
      default:
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Unsupported contribution type: <strong>{type}</strong>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {!typeOverride && (
        <FormSection title="Edit Contribution Type">
          <Label htmlFor="contribution-type">Contribution Type</Label>
          <Select
            id="contribution-type"
            value={type}
            onChange={(e) => setType(e.target.value as ContributionType)}
            options={[
              { value: 'post', label: 'Post' },
              { value: 'quest', label: 'Quest' },
            ]}
          />
        </FormSection>
      )}

      {renderEditor()}
    </div>
  );
};

export default EditContribution;