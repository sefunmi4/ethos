import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Quest } from '../../types/questTypes';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { Button, PostTypeBadge, Select } from '../ui';
import { ROUTES } from '../../constants/routes';
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
  const [view, setView] = useState<'timeline' | 'kanban' | 'map'>('map');
  const [expanded, setExpanded] = useState(false);
  const [questData, setQuestData] = useState<Quest>(quest);
  const [logs, setLogs] = useState<Post[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [linkDraft, setLinkDraft] = useState(quest.linkedPosts || []);
  const navigate = useNavigate();
  const viewOptions = [
    { value: 'map', label: 'Map - Graph' },
    { value: 'timeline', label: 'Log' },
    { value: 'kanban', label: 'Log Status - Card' },
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
    if (!expanded) return;

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
  }, [quest.id, expanded]);

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{questData.title}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <PostTypeBadge type="quest" />
          <button
            type="button"
            onClick={() =>
              navigate(
                questData.authorId === user?.id
                  ? ROUTES.PROFILE
                  : ROUTES.PUBLIC_PROFILE(questData.authorId)
              )
            }
            className="text-blue-600 underline"
          >
            @{questData.headPost?.author?.username || questData.authorId}
          </button>
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
        <Button
          variant="ghost"
          onClick={() => {
            if (expanded) {
              setExpanded(false);
            } else {
              setExpanded(true);
              setView('map');
            }
          }}
        >
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </Button>

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
            onEditLinks={() => setShowLinkEditor(true)}
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
                  questId={quest.id}
                  boardId={`log-${quest.id}`}
                  onSave={(p) => {
                    setLogs((prev) => [...prev, p]);
                    setShowLogForm(false);
                  }}
                  onCancel={() => setShowLogForm(false)}
                />
              </div>
            )}
            <GridLayout
              questId={quest.id}
              items={logs}
              user={user}
              layout="vertical"
            />
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
                  questId={quest.id}
                  boardId={`map-${quest.id}`}
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
                  questId={quest.id}
                  boardId={`map-${quest.id}`}
                  onSave={(p) => {
                    setLogs((prev) => [...prev, p]);
                    setShowTaskForm(false);
                  }}
                  onCancel={() => setShowTaskForm(false)}
                />
              </div>
            )}
            <div className="text-right mb-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowTaskForm(true)}
              >
                + Add Item
              </Button>
            </div>
            <GraphLayout items={logs as any} user={user} edges={questData.taskGraph} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg shadow bg-white dark:bg-card-dark p-6 text-gray-900 dark:text-gray-100">
      {renderHeader()}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-2">
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
      {renderView()}
    </div>
  );
};

export default QuestCard;