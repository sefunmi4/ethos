import React from 'react';
import EditPost from '../posts/EditPost';
import EditQuest from '../quests/EditQuest';
import EditProject from '../projects/EditProject';
import EditBoard from '../boards/EditBoard';

const EditContribution = ({ contribution, onSave, onCancel, context = {} }) => {
  if (!contribution || !contribution.type) {
    return <p className="text-gray-500">No contribution selected for editing.</p>;
  }

  switch (contribution.type) {
    case 'post':
    case 'free_speech':
    case 'request':
    case 'quest_log':
    case 'quest_task':
      return (
        <EditPost
          post={contribution}
          onSave={onSave}
          onCancel={onCancel}
          context={context}
        />
      );

    case 'quest':
      return (
        <EditQuest
          quest={contribution}
          onSave={onSave}
          onCancel={onCancel}
          context={context}
        />
      );

    case 'project':
      return (
        <EditProject
          project={contribution}
          onSave={onSave}
          onCancel={onCancel}
          context={context}
        />
      );

    case 'board':
      return (
        <EditBoard
          board={contribution}
          onSave={onSave}
          onCancel={onCancel}
          context={context}
        />
      );

    default:
      return (
        <div className="text-red-500 text-sm">
          Unsupported contribution type: <strong>{contribution.type}</strong>
        </div>
      );
  }
};

export default EditContribution;
