import React from 'react';
import PostCard from '../posts/PostCard';
import QuestCard from '../quests/QuestCard';
import ProjectCard from '../projects/ProjectCard';

/**
 * ContributionCard
 * A smart dispatcher that chooses the appropriate card to render
 * based on the contribution's type.
 *
 * This is used by BoardItemCard or any layout engine when you don’t know
 * what kind of contribution you're rendering.
 */
const ContributionCard = ({ contribution, user, ...props }) => {
  if (!contribution) return null;

  const { id, type, kind } = contribution;

  if (!id) {
    console.warn('[ContributionCard] Invalid contribution object:', contribution);
    return null;
  }

  const resolvedType = type || kind || 'post';

  const sharedProps = { user, ...props };

  switch (resolvedType) {
    case 'post':
    case 'free_speech':
    case 'review':
    case 'request':
    case 'quest_log':
    case 'quest_task':
      return <PostCard post={contribution} {...sharedProps} />;

    case 'quest':
      return <QuestCard quest={contribution} {...sharedProps} />;

    case 'project':
      return <ProjectCard project={contribution} {...sharedProps} />;

    default:
      console.warn('[ContributionCard] Unknown contribution type:', resolvedType);
      return (
        <div className="p-4 border rounded text-sm text-gray-500 bg-gray-50">
          Unknown contribution type: <strong>{resolvedType}</strong>
        </div>
      );
  }
};

export default ContributionCard;