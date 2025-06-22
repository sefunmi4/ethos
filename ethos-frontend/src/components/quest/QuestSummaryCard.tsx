import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { toTitleCase } from '../../utils/displayUtils';
import type { Quest } from '../../types/questTypes';
import Button from '../ui/Button';

interface QuestSummaryCardProps {
  quest: Quest;
}

const QuestSummaryCard: React.FC<QuestSummaryCardProps> = ({ quest }) => {
  const rankTag = quest.tags?.find(t => t.toLowerCase().startsWith('rank:'));
  const difficultyTag = quest.tags?.find(t => t.toLowerCase().startsWith('difficulty:'));
  const rewardTag = quest.tags?.find(t => t.toLowerCase().startsWith('reward:'));
  const roleTags = quest.tags?.filter(t => t.toLowerCase().startsWith('role:')) || [];

  const rank = rankTag ? rankTag.split(':')[1] : 'Unrated';
  const difficulty = difficultyTag ? difficultyTag.split(':')[1] : 'Unknown';
  const reward = rewardTag ? rewardTag.split(':')[1] : 'Unknown';
  const roles = roleTags.map(t => t.split(':')[1]).join(', ');

  const desc = quest.description || '';
  const shortDesc = desc.length > 120 ? desc.slice(0, 117) + '…' : desc;

  return (
    <div className="border border-secondary rounded bg-surface p-4 space-y-2 shadow">
      <h3 className="text-lg font-bold text-primary">{toTitleCase(quest.title)}</h3>
      {shortDesc && <p className="text-sm text-secondary">{shortDesc}</p>}
      <div className="text-xs text-secondary space-y-0.5">
        <div>Rank: {rank}</div>
        <div>Difficulty: {difficulty}</div>
        <div>Reward: {reward}</div>
        {roles && <div>Roles Needed: {roles}</div>}
      </div>
      <div className="flex gap-2 pt-2">
        <Link to={ROUTES.QUEST(quest.id)} className="text-sm text-blue-600 underline">
          Details
        </Link>
        <Button size="sm" variant="contrast">
          Join Quest
        </Button>
      </div>
    </div>
  );
};

export default QuestSummaryCard;
