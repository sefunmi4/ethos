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
const ContributionCard = ({
  contribution,
  user,
  ...props
}) => {
  if (!contribution) return null;

  if (!contribution?.id) {
    console.warn('[ContributionCard] Invalid contribution object:', contribution);
    return null;
  }


  const type = contribution.type || contribution.kind || 'post';
  
  switch (type) {
    case 'post':
    case 'free_speech':
    case 'review':
    case 'request':
    case 'quest_log':
    case 'quest_task':
      return <PostCard post={contribution} user={user} {...props} />;

    case 'quest':
      return <QuestCard quest={contribution} user={user} {...props} />;

    case 'project':
      return <ProjectCard project={contribution} user={user} {...props} />;

    default:
      return (
        <div className="p-4 border rounded text-sm text-gray-500">
          Unknown contribution type: {type}
        </div>
      );
  }
};

export default ContributionCard;