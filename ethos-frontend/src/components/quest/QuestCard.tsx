import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Quest } from '../../types/questTypes';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { Button, PostTypeBadge, Select } from '../ui';
import { ROUTES } from '../../constants/routes';
import GraphLayout from '../layout/GraphLayout';
import GridLayout from '../layout/GridLayout';
import MapGraphLayout from '../layout/MapGraphLayout';
import CreatePost from '../post/CreatePost';
import { fetchQuestById, updateQuestById } from '../../api/quest';
import { fetchPostsByQuestId } from '../../api/post';
import LinkViewer from '../ui/LinkViewer';
import LinkControls from '../controls/LinkControls';
import ActionMenu from '../ui/ActionMenu';
import GitFileBrowser from '../git/GitFileBrowser';
import QuestNodeInspector from './QuestNodeInspector';
import PostCard from '../post/PostCard';
import FileEditorPanel from './FileEditorPanel';
import StatusBoardPanel from './StatusBoardPanel';
import LogThreadPanel from './LogThreadPanel';


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
  defaultExpanded?: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  user,
  onJoinToggle,
  onDelete,
  onEdit,
  onCancel,
  defaultExpanded = false,
}) => {
  const [mapMode, setMapMode] = useState<'folder' | 'graph'>('folder');
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'file' | 'map' | 'files'>('status');
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [questData, setQuestData] = useState<Quest>(quest);
  const [logs, setLogs] = useState<Post[]>([]);
  const [selectedNode, setSelectedNode] = useState<Post | null>(null);
  const [rootNode, setRootNode] = useState<Post | null>(null);
  const [leftWidth, setLeftWidth] = useState(280);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [linkDraft, setLinkDraft] = useState(quest.linkedPosts || []);
  const [joinRequested, setJoinRequested] = useState(false);
  const navigate = useNavigate();

  const mapOptions = [
    { value: 'folder', label: 'Folder Map' },
    { value: 'graph', label: 'Task Graph' },
  ];
  const tabOptions = [
    { value: 'status', label: 'Status' },
    { value: 'logs', label: 'Logs' },
    { value: 'file', label: 'File/Folder' },
  ];

  const isOwner = user?.id === questData.authorId;
  const isCollaborator = questData.collaborators?.some(c => c.userId === user?.id);
  const canEdit = isOwner || isCollaborator;
  const hasJoined = isOwner || isCollaborator;

  const handleJoinRequest = () => {
    if (!user?.id) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (hasJoined) {
      alert('You are already part of this quest.');
      return;
    }
    if (joinRequested) {
      alert('Request already sent. Awaiting approval.');
      return;
    }
    onJoinToggle?.(questData);
    setJoinRequested(true);
    alert('Join request sent.');
  };

  const saveLinks = async () => {
    try {
      await updateQuestById(quest.id, { linkedPosts: linkDraft });
      setQuestData({ ...questData, linkedPosts: linkDraft });
      setShowLinkEditor(false);
    } catch (err) {
      console.error("[QuestCard] Failed to save links:", err);
    }
  };

  const handleDividerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startWidth = leftWidth;
    const onMove = (ev: MouseEvent) => {
      const newWidth = Math.min(500, Math.max(200, startWidth + ev.clientX - startX));
      setLeftWidth(newWidth);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
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
        const rootCandidates = questLogs.filter(
          (p) => !(questDetails.taskGraph || []).some((e) => e.to === p.id),
        );
        const root = rootCandidates[0] || questLogs[0] || null;
        setRootNode(root);
        setSelectedNode(root);
        setLinkDraft(questDetails.linkedPosts || []);
      } catch (error) {
        console.error("[QuestCard] Failed to fetch quest data:", error);
      }
    };
    fetchData();
  }, [quest.id, expanded]);

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
      <div className="space-y-1">
        <h2
          className="text-xl font-bold text-primary cursor-pointer underline"
          onClick={() => navigate(ROUTES.QUEST(quest.id))}
        >
          {questData.title}
        </h2>
        <div className="flex items-center gap-2 text-sm text-secondary">
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
        <Button
          variant="ghost"
          onClick={() => {
            if (expanded) {
              setExpanded(false);
            } else {
              setExpanded(true);
              setActiveTab("status");
              setMapMode("folder");
            }
          }}
        >
          {expanded ? "▲ Collapse" : "▼ Expand"}
        </Button>

        <ActionMenu
          type="quest"
          id={quest.id}
          canEdit={isOwner}
          onEdit={isOwner ? () => onEdit?.(questData) : undefined}
          onEditLinks={isOwner ? () => setShowLinkEditor(true) : undefined}
          onDelete={isOwner ? () => onDelete?.(questData) : undefined}
          onArchived={isOwner ? () => {
            console.log(`[QuestCard] Quest ${quest.id} archived`);
          } : undefined}
          onJoin={!hasJoined ? handleJoinRequest : undefined}
          joinLabel="Request to Join"
          permalink={`${window.location.origin}${ROUTES.QUEST(quest.id)}`}
        />

        {expanded && (
          <>
            <Select
              value={mapMode}
              onChange={(e) => setMapMode(e.target.value as "folder" | "graph")}
              options={mapOptions}
            />
            <Select
              value={activeTab}
              onChange={(e) =>
                setActiveTab(e.target.value as "status" | "logs" | "file")
              }
              options={tabOptions}
            />
          </>
        )}

        {onCancel && (
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  const renderMap = () => {
    if (!expanded) return null;
    if (mapMode === "graph") {
      return <MapGraphLayout items={logs as any} edges={questData.taskGraph} />;
    }
    return (
      <>
        {selectedNode && (
          <div className="mb-2">
            <PostCard post={selectedNode} user={user} questId={quest.id} />
          </div>
        )}
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
          {canEdit ? (
            <Button
              size="sm"
              variant="contrast"
              onClick={() => setShowTaskForm(true)}
            >
              + Add Item
            </Button>
          ) : (
            <Button size="sm" variant="contrast" onClick={handleJoinRequest}>
              Request to Join
            </Button>
          )}
        </div>
        <GraphLayout
          items={logs as any}
          user={user}
          edges={questData.taskGraph}
          condensed
          questId={quest.id}
          showStatus={false}
          onSelectNode={setSelectedNode}
          showInspector={false}
        />
      </>
    );
  };

  const renderFileView = () => {
    if (!selectedNode) return <div className="p-2 text-sm">Select a task</div>;
    const childIds = (questData.taskGraph || [])
      .filter((e) => e.from === selectedNode.id)
      .map((e) => e.to);
    const children = logs.filter((p) => childIds.includes(p.id));
    const isFolder = selectedNode.id === rootNode?.id || children.length > 0;
    if (isFolder) {
      return (
        <div className="text-sm p-2 space-y-1">
          <div className="font-semibold">Folder: {selectedNode.content}</div>
          <ul className="pl-4 list-disc">
            {children.map((c) => (
              <li key={c.id}>{c.content}</li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div className="space-y-2 p-2">
        <FileEditorPanel
          questId={quest.id}
          filePath={selectedNode.gitFilePath || 'file.txt'}
          content={selectedNode.content}
        />
        <StatusBoardPanel questId={quest.id} linkedNodeId={selectedNode.id} />
      </div>
    );
  };

  const renderRightPanel = () => {
    if (!expanded) return null;
    let panel: React.ReactNode = null;
    switch (activeTab) {
      case 'logs':
        if (!selectedNode) {
          panel = (
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
                editable={canEdit}
              />
              <div className="text-right mt-2">
                {canEdit ? (
                  <Button size="sm" variant="contrast" onClick={() => setShowLogForm(true)}>
                    + Add Item
                  </Button>
                ) : (
                  <Button size="sm" variant="contrast" onClick={handleJoinRequest}>
                    Request to Join
                  </Button>
                )}
              </div>
            </>
          );
        } else {
          panel = <LogThreadPanel questId={quest.id} node={selectedNode} user={user} />;
        }
        break;
      case 'file':
        panel = renderFileView();
        break;
      case 'status':
        if (!selectedNode) {
          panel = (
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
                editable={canEdit}
                compact
              />
              <div className="text-right mt-2">
                {canEdit ? (
                  <Button size="sm" variant="contrast" onClick={() => setShowTaskForm(true)}>
                    + Add Item
                  </Button>
                ) : (
                  <Button size="sm" variant="contrast" onClick={handleJoinRequest}>
                    Request to Join
                  </Button>
                )}
              </div>
            </>
          );
        } else {
          panel = <StatusBoardPanel questId={quest.id} linkedNodeId={selectedNode.id} />;
        }
        break;
      case 'map':
        panel = (
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
              {canEdit ? (
                <Button size="sm" variant="contrast" onClick={() => setShowTaskForm(true)}>
                  + Add Item
                </Button>
              ) : (
                !hasJoined && (
                  <Button size="sm" variant="contrast" onClick={handleJoinRequest}>
                    Request to Join
                  </Button>
                )
              )}
            </div>
            <GraphLayout
              items={logs as any}
              user={user}
              edges={questData.taskGraph}
              condensed
              showInspector={false}
            />
          </>
        );
        break;
      case 'files':
        panel = <GitFileBrowser questId={quest.id} onClose={() => setActiveTab('map')} />;
        break;
      default:
        panel = null;
    }

    return (
      <>
        {selectedNode && (
          <div className="mb-2">
            <PostCard post={selectedNode} user={user} questId={quest.id} />
          </div>
        )}
        {panel}
      </>
    );
  };

  return (
    <div className="border border-secondary rounded-lg shadow bg-surface p-6 text-primary">
      {renderHeader()}
      <div className="text-xs text-secondary space-y-1 mb-2">
        {showLinkEditor && (
          <div className="mt-2">
            <LinkControls
              value={linkDraft}
              onChange={setLinkDraft}
              allowCreateNew={false}
              itemTypes={["quest", "post"]}
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
      {expanded && (
        <div className="flex flex-col md:flex-row gap-4">
          <div
            className="overflow-auto md:pr-4 md:border-r md:border-gray-300 dark:md:border-gray-700"
            style={{ width: leftWidth }}
          >
            {renderMap()}
          </div>
          <div
            className="hidden md:block w-1 bg-gray-200 dark:bg-gray-600 cursor-ew-resize"
            onMouseDown={handleDividerMouseDown}
          />
          <div className="flex-1 md:pl-4 overflow-auto">{renderRightPanel()}</div>
        </div>
      )}
    </div>
  );
};

export default QuestCard;
