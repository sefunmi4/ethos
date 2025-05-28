import React, { useState } from 'react';
import PostCard from '../posts/PostCard';
import QuestCard from '../quests/QuestCard';
import ProjectCard from '../projects/ProjectCard';
import Card from '../contribution/ContrubitionCard';

const BoardItemCard = ({ item, onClick, expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
    onClick?.(item);
  };

  if (!item || !item.type) return null;

  const renderContent = () => {
    switch (item.type) {
      case 'post':
        return <PostCard post={item} compact={!isExpanded} />;
      case 'quest':
        return <QuestCard quest={item} expanded={isExpanded} />;
      case 'project':
        return <ProjectCard project={item} expanded={isExpanded} />;
      default:
        return (
          <div className="text-sm text-gray-500">
            Unsupported item type: <strong>{item.type}</strong>
          </div>
        );
    }
  };

  return (
    <Card
      className="cursor-pointer transition hover:shadow-lg"
      onClick={toggleExpand}
      aria-expanded={isExpanded}
    >
      {renderContent()}
    </Card>
  );
};

export default BoardItemCard;
