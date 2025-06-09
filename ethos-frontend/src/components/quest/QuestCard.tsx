import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Quest } from '../../types/questTypes';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { Button, PostTypeBadge, Select } from '../ui';
import { ROUTES } from '../../constants/routes';
import ThreadLayout from '../layout/ThreadLayout';
import GraphLayout from '../layout/GraphLayout';
import GridLayout from '../layout/GridLayout';
import CreatePost from '../post/CreatePost';
import { fetchQuestById, updateQuestById } from '../../api/quest';
import { fetchPostsByQuestId } from '../../api/post';
import LinkViewer from '../ui/LinkViewer';
import LinkControls from '../controls/LinkControls';
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
  const [expanded, setExpanded] = useState(false);
  const [questData, setQuestData] = useState<Quest>(quest);
  const [logs, setLogs] = useState<Post[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [linkDraft, setLinkDraft] = useState(quest.linkedPosts || []);
  const navigate = useNavigate();
  const viewOptions = [
    { value: 'timeline', label: 'Log' },
    { value: 'kanban', label: 'Card' },
    { value: 'map', label: 'Graph' },
  ];

  const isOwner = user?.id === questData.authorId;

  const saveLinks = async () => {
    try {
      await updateQuestById(quest.id, { linkedPosts: linkDraft });
      setQuestData({ ...questData, linkedPosts: linkDraft });
      setShowLinkEditor(false);
    } catch (err) {
      console.error('[QuestCard] Failed to save links:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questDetails, questLogs] = await Promise.all([
          fetchQuestById(quest.id),
          fetchPostsByQuestId(quest.id),
        ]);
        setQuestData(questDetails);
        setLogs(questLogs);
        setLinkDraft(questDetails.linkedPosts || []);
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
          {questData.gitRepo?.repoUrl && (
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
            permalink={`${window.location.origin}${ROUTES.QUEST(quest.id)}`}
          />
        )}
  
        {expanded && (
          <Select
            value={view}
            onChange={(e) => setView(e.target.value as 'timeline' | 'kanban' | 'map')}
            options={viewOptions}
          />
        )}
        <Button onClick={() => navigate(ROUTES.QUEST(quest.id))} variant="ghost">
          View details
        </Button>
  
        {onCancel && (
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  const renderView = () => {
    if (!expanded) return null;
    switch (view) {
      case 'timeline':
        return (
          <>
            {showLogForm && (
              <div className="mb-4">
                <CreatePost
                  initialType="log"
                  onSave={(p) => {
                    setLogs((prev) => [...prev, p]);
                    setShowLogForm(false);
                  }}
                  onCancel={() => setShowLogForm(false)}
                />
              </div>
            )}
            <ThreadLayout contributions={logs} user={user} questId={quest.id} />
            <div className="text-right mt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowLogForm(true)}
              >
                + Add Item
              </Button>
            </div>
        </>
      );
      case 'kanban':
        return (
          <>
            {showTaskForm && (
              <div className="mb-4">
                <CreatePost
                  initialType="task"
                  onSave={(p) => {
                    setLogs((prev) => [...prev, p]);
                    setShowTaskForm(false);
                  }}
                  onCancel={() => setShowTaskForm(false)}
                />
              </div>
            )}
            <GridLayout
              questId={quest.id}
              items={logs}
              user={user}
              layout="kanban"
            />
            <div className="text-right mt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowTaskForm(true)}
              >
                + Add Item
              </Button>
            </div>
          </>
        );
      case 'map':
        return (
          <>
            {showTaskForm && (
              <div className="mb-4">
                <CreatePost
                  initialType="task"
                  onSave={(p) => {
                    setLogs((prev) => [...prev, p]);
                    setShowTaskForm(false);
                  }}
                  onCancel={() => setShowTaskForm(false)}
                />
              </div>
            )}
            <GraphLayout items={logs as any} user={user} edges={questData.taskGraph} />
            <div className="text-right mt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowTaskForm(true)}
              >
                + Add Item
              </Button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg shadow bg-white p-6">
      {renderHeader()}
      <div className="text-xs text-gray-500 space-y-1 mb-2">
        <button
          type="button"
          onClick={() => setShowLinkEditor((v) => !v)}
          className="text-blue-600 underline"
        >
          {questData.linkedPosts && questData.linkedPosts.length > 0
            ? `🔗 Linked to ${questData.linkedPosts.length} items`
            : 'Link to item'}
        </button>
        {showLinkEditor && (
          <div className="mt-2">
            <LinkControls
              value={linkDraft}
              onChange={setLinkDraft}
              allowCreateNew={false}
              itemTypes={['quest', 'post']}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
                onClick={saveLinks}
              >
                Save
              </button>
              <button
                type="button"
                className="text-xs underline"
                onClick={() => {
                  setLinkDraft(questData.linkedPosts || []);
                  setShowLinkEditor(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {questData.linkedPosts && questData.linkedPosts.length > 0 && (
          <LinkViewer items={questData.linkedPosts} />
        )}
      </div>
      {!expanded && (
        <button
          onClick={() => {
            setExpanded(true);
            setView('map');
          }}
          className="text-blue-600 underline text-sm"
        >
          🗺 Map
        </button>
      )}
      {renderView()}
      {expanded && (
        <div className="text-right mt-2">
          <button className="text-xs underline" onClick={() => setExpanded(false)}>
            Collapse
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestCard;