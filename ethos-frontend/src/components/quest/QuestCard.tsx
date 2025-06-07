import React, { useState, useEffect } from 'react';
import type { Quest } from '../../types/questTypes';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { Button, PostTypeBadge } from '../ui';
import ThreadLayout from '../layout/ThreadLayout';
import GraphLayout from '../layout/GraphLayout';
import GridLayout from '../layout/GridLayout';
import { fetchQuestById } from '../../api/quest';
import { fetchPostsByQuestId } from '../../api/post';
import ActionMenu from '../ui/ActionMenu';

/**
 * Props for QuestCard component
 */
interface QuestCardProps {
  quest: Quest;
  user?: User;
  compact?: boolean;
  onJoinToggle?: (quest: Quest) => void;
  onDelete?: (quest: Quest) => void;
  onEdit?: (quest: Quest) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  user,
  onJoinToggle,
  onDelete,
  onEdit,
  onCancel,
}) => {
  const [view, setView] = useState<'timeline' | 'kanban' | 'map'>('timeline');
  const [questData, setQuestData] = useState<Quest>(quest);
  const [logs, setLogs] = useState<Post[]>([]);

  const isOwner = user?.id === questData.authorId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questDetails, questLogs] = await Promise.all([
          fetchQuestById(quest.id),
          fetchPostsByQuestId(quest.id),
        ]);
        setQuestData(questDetails);
        setLogs(questLogs);
      } catch (error) {
        console.error('[QuestCard] Failed to fetch quest data:', error);
      }
    };
    fetchData();
  }, [quest.id]);

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-800">{questData.title}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <PostTypeBadge type="quest" />
          <span>{questData.createdAt?.slice(0, 10)}</span>
          {questData.gitRepo.repoUrl && (
            <a
              href={questData.gitRepo.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Git Repo
            </a>
          )}
        </div>
      </div>
  
      <div className="flex gap-2 mt-2 md:mt-0 items-center flex-wrap">
        {!isOwner && (
          <Button onClick={() => onJoinToggle?.(questData)} variant="primary">
            Join Quest
          </Button>
        )}
  
        {isOwner && (
          <ActionMenu
            type="quest"
            id={quest.id}
            canEdit={true}
            onEdit={() => onEdit?.(questData)}
            onDelete={() => onDelete?.(questData)}
            onArchived={() => {
              console.log(`[QuestCard] Quest ${quest.id} archived`);
            }}
            permalink={`${window.location.origin}/quests/${quest.id}`}
          />
        )}
  
        <Button onClick={() => setView('timeline')}>Timeline</Button>
        <Button onClick={() => setView('kanban')}>Kanban</Button>
        <Button onClick={() => setView('map')}>Map</Button>
  
        {onCancel && (
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'timeline':
        return <ThreadLayout contributions={logs} user={user} />;
      case 'kanban':
        return <GridLayout questId={quest.id} items={logs} user={user} />;
      case 'map':
        return (
          <GraphLayout
            items={logs as any}
            user={user}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg shadow bg-white p-6">
      {renderHeader()}
      {renderView()}
    </div>
  );
};

export default QuestCard;