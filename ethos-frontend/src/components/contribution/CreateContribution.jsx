import React, { useState } from 'react';
import CreatePost from '../posts/CreatePost';
import CreateQuest from '../quests/CreateQuest';
import CreateProject from '../projects/CreateProject';
import CreateBoard from '../board/CreateBoard';
import Select from '../../ui/Select';
import FormSection from '../../ui/FormSection';

const CONTRIBUTION_TYPES = [
  { value: 'post', label: 'Post' },
  { value: 'quest', label: 'Quest' },
  { value: 'project', label: 'Project' },
  { value: 'board', label: 'Board' }
];

const CreateContribution = ({ onSave, onCancel, quests = [], boards = [] }) => {
  const [type, setType] = useState('post');

  const renderForm = () => {
    const sharedProps = { onSave, onCancel, quests };
    switch (type) {
      case 'post':
        return <CreatePost {...sharedProps} />;
      case 'quest':
        return <CreateQuest {...sharedProps} />;
      case 'project':
        return <CreateProject {...sharedProps} />;
      case 'board':
        return <CreateBoard onSave={onSave} onCancel={onCancel} existingBoards={boards} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <FormSection title="Create New Contribution">
        <Select
          label="Contribution Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={CONTRIBUTION_TYPES}
        />
      </FormSection>

      {renderForm()}
    </div>
  );
};

export default CreateContribution;
