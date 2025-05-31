import React, { useState } from 'react';
import CreatePost from '../posts/CreatePost';
import CreateQuest from '../quests/CreateQuest';
import CreateProject from '../projects/CreateProject';
import Select from '../ui/Select';
import FormSection from '../ui/FormSection';

const CONTRIBUTION_TYPES = [
  { value: 'post', label: 'Post' },
  { value: 'quest', label: 'Quest' },
  { value: 'project', label: 'Project' }
];

const CreateContribution = ({
  onSave,
  onCancel,
  quests = [],
  boards = [],
  typeOverride = null,         // 👉 allow forcing one type
  replyTo = null,              // 👉 support reply posts
  repostSource = null          // 👉 support reposting
}) => {
  const [type, setType] = useState(typeOverride || 'post');

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
      case 'project':
        return <CreateProject {...sharedProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!typeOverride && (
        <FormSection title="Create New Contribution">
          <Select
            label="Contribution Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={CONTRIBUTION_TYPES}
          />
        </FormSection>
      )}

      {renderForm()}
    </div>
  );
};

export default CreateContribution;