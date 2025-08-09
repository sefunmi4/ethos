import React, { useState } from 'react';

import CreatePost from '../post/CreatePost';
import CreateQuest from '../quest/CreateQuest';
import Select from '../ui/Select';
import { FormSection, Label } from '../ui';

import type { Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';
import type { BoardData } from '../../types/boardTypes';

type ContributionType = 'post' | 'quest';

export interface CreateContributionProps {
  onSave: (item: Post | Quest) => void | Promise<void>; 
  onCancel: () => void;
  boards: BoardData[];
  quests: Quest[];
  typeOverride?: ContributionType | null;
  replyTo?: Post | null;
  repostSource?: Post | null;
}

const CONTRIBUTION_TYPES: { value: ContributionType; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'quest', label: 'Quest' },
];

/**
 * A dynamic wrapper component that renders the appropriate contribution form
 * (Post or Quest) based on user selection or a predefined override.
 *
 * @param onSave - Callback when the form is submitted successfully.
 * @param onCancel - Callback when the form is cancelled.
 * @param quests - Optional list of quests to associate with the contribution.
 * @param boards - Optional list of boards for context.
 * @param typeOverride - If provided, forces the form to only show that contribution type.
 * @param replyTo - Optional post the new post is replying to.
 * @param repostSource - Optional post being reposted.
 */
const CreateContribution: React.FC<CreateContributionProps> = ({
  onSave,
  onCancel,
  quests = [],
  boards = [],
  typeOverride = null,
  replyTo = null,
  repostSource = null,
}) => {
  const [type, setType] = useState<ContributionType>(typeOverride || 'post');

  const sharedProps = { onSave, onCancel, quests, boards };

  const renderForm = () => {
    switch (type) {
      case 'post':
        return (
          <CreatePost
            {...sharedProps}
            replyTo={replyTo}
            repostSource={repostSource}
          />
        );
      case 'quest':
        return <CreateQuest {...sharedProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!typeOverride && (
        <FormSection title="Create New Contribution">
            <Label htmlFor="contribution-type">Contribution Type</Label>
            <Select
                id="contribution-type"
                value={type}
                onChange={(e) => setType(e.target.value as ContributionType)}
                options={CONTRIBUTION_TYPES}
            />
        </FormSection>
      )}
      {renderForm()}
    </div>
  );
};

export default CreateContribution;