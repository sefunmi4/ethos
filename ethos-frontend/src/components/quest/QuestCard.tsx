import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Quest, TaskEdge } from '../../types/questTypes';
import type { Post, QuestTaskStatus } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { Button, SummaryTag, Select } from '../ui';
import { POST_TYPE_LABELS, toTitleCase } from '../../utils/displayUtils';
import { ROUTES } from '../../constants/routes';
import GridLayout from '../layout/GridLayout';
import MapGraphLayout from '../layout/MapGraphLayout';
import GraphLayout from '../layout/GraphLayout';
import CreatePost from '../post/CreatePost';
import { fetchQuestById, updateQuestById, updateQuestTaskGraph } from '../../api/quest';
import { fetchPostsByQuestId } from '../../api/post';
import LinkControls from '../controls/LinkControls';
import ActionMenu from '../ui/ActionMenu';
import TaskPreviewCard from '../post/TaskPreviewCard';
import FileEditorPanel from './FileEditorPanel';
import StatusBoardPanel from './StatusBoardPanel';
import GitFileBrowserInline from '../git/GitFileBrowserInline';
import GitDiffViewer from '../git/GitDiffViewer';
import { useGitDiff } from '../../hooks/useGit';
import SubtaskChecklist from './SubtaskChecklist';
import { getRank } from '../../utils/rankUtils';
import { STATUS_OPTIONS } from '../../constants/options';
import type { option } from '../../constants/options';
import { updatePost } from '../../api/post';

const RANK_ORDER: Record<string, number> = { E: 0, D: 1, C: 2, B: 3, A: 4, S: 5 };
import LogThreadPanel from './LogThreadPanel';
import QuickTaskForm from '../post/QuickTaskForm';
import TeamPanel from './TeamPanel';


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
  /** Hide the built-in expand/collapse toggle button */
  hideToggle?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Callback when expand toggled */
  onToggleExpand?: () => void;
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  user,
  onJoinToggle,
  onDelete,
  onEdit,
  onCancel,
  defaultExpanded = false,
  hideToggle = false,
  expanded: expandedProp,
  onToggleExpand,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'logs' | 'options'>('file');
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [questData, setQuestData] = useState<Quest>(quest);
  const [logs, setLogs] = useState<Post[]>([]);
  const [selectedNode, setSelectedNode] = useState<Post | null>(null);
  const [rootNode, setRootNode] = useState<Post | null>(null);
  const [mapWidth, setMapWidth] = useState(240);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [linkDraft, setLinkDraft] = useState(quest.linkedPosts || []);
  const [joinRequested, setJoinRequested] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showFolderView, setShowFolderView] = useState(false);
  const navigate = useNavigate();

  const { data: diffData, isLoading: diffLoading } = useGitDiff({
    questId: quest.id,
    filePath: selectedNode?.gitFilePath,
    commitId: selectedNode?.gitCommitSha,
  });

  const expanded = expandedProp !== undefined ? expandedProp : internalExpanded;

  const rankTag = questData.tags?.find(t => t.toLowerCase().startsWith('rank:'));
  const difficultyTag = questData.tags?.find(t => t.toLowerCase().startsWith('difficulty:'));
  const rewardTag = questData.tags?.find(t => t.toLowerCase().startsWith('reward:'));
  const roleTags = questData.tags?.filter(t => t.toLowerCase().startsWith('role:')) || [];

  const rank = rankTag ? rankTag.split(':')[1] : 'Unrated';
  const difficulty = difficultyTag ? difficultyTag.split(':')[1] : 'Unknown';
  const reward = rewardTag ? rewardTag.split(':')[1] : 'Unknown';
  const roles = roleTags.map(t => t.split(':')[1]).join(', ');
  const desc = questData.description || '';
  const shortDesc = desc.length > 120 ? desc.slice(0, 117) + '…' : desc;
  const userRank = getRank(user?.xp ?? 0);

  const tabOptions = [
    {
      value: 'file',
      label:
        selectedNode?.taskType === 'file'
          ? 'File'
          : selectedNode?.taskType === 'folder'
          ? 'Folder'
          : 'Planner',
    },
    { value: 'logs', label: 'Logs' },
    { value: 'options', label: 'Options' },
  ];

  const isOwner = user?.id === questData.authorId;
  const isCollaborator = questData.collaborators?.some(c => c.userId === user?.id);
  const canEdit = isOwner || isCollaborator;
  const hasJoined = isOwner || isCollaborator;

  const subgraphIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const ids = new Set<string>();
    const gather = (id: string) => {
      ids.add(id);
      (questData.taskGraph || [])
        .filter((e) => e.from === id)
        .forEach((e) => gather(e.to));
    };
    gather(selectedNode.id);
    return ids;
  }, [selectedNode, questData.taskGraph]);

  const folderNodes = useMemo(
    () => logs.filter((p) => subgraphIds.has(p.id)),
    [logs, subgraphIds],
  );

  const folderEdges = useMemo(
    () =>
      (questData.taskGraph || []).filter(
        (e) => subgraphIds.has(e.from) && subgraphIds.has(e.to),
      ),
    [questData.taskGraph, subgraphIds],
  );

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

  const handleSelectedNodeUpdate = (updated: Post) => {
    setSelectedNode(updated);
    setLogs(prev => prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p)));
    if (rootNode?.id === updated.id) {
      setRootNode(updated);
    }
  };


  const handleDividerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startWidth = mapWidth;
    const onMove = (ev: MouseEvent) => {
      const newWidth = Math.min(400, Math.max(240, startWidth + ev.clientX - startX));
      setMapWidth(newWidth);
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

  useEffect(() => {
    const handleTaskOpen = (e: Event) => {
      const evt = e as CustomEvent<{ taskId: string }>;
      const node = logs.find((p) => p.id === evt.detail.taskId);
      if (node) {
        setSelectedNode(node);
        setActiveTab('file');
      }
    };
    window.addEventListener('questTaskOpen', handleTaskOpen);
    return () => window.removeEventListener('questTaskOpen', handleTaskOpen);
  }, [logs, rootNode]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { task } = (e as CustomEvent<{ task: Post }>).detail;
      setLogs(prev => prev.map(p => (p.id === task.id ? { ...p, ...task } : p)));
      if (selectedNode?.id === task.id) setSelectedNode({ ...selectedNode, ...task });
      if (rootNode?.id === task.id) setRootNode({ ...rootNode, ...task });
    };
    window.addEventListener('taskUpdated', handler);
    return () => window.removeEventListener('taskUpdated', handler);
  }, [selectedNode, rootNode]);

  useEffect(() => {
    setStatusVal(selectedNode?.status || 'To Do');
  }, [selectedNode?.status]);






  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <SummaryTag type="quest" label={POST_TYPE_LABELS.quest} />
          <Link
            to={ROUTES.QUEST(quest.id)}
            className="text-xl font-bold text-primary underline"
          >
            {toTitleCase(questData.title)}
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary">
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
        {!hideToggle && (
          <Button
            variant="ghost"
            onClick={() => {
              if (onToggleExpand) {
                onToggleExpand();
              } else {
                setInternalExpanded((prev) => !prev);
              }
              if (!expanded) {
                setActiveTab('file');
              }
            }}
          >
            {expanded ? "▲ Collapse" : "▼ Expand"}
          </Button>
        )}

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

    const handleEdgesSave = async (edges: TaskEdge[]) => {
      try {
        await updateQuestTaskGraph(quest.id, edges);
        setQuestData((prev) => ({ ...prev, taskGraph: edges }));
      } catch (err) {
        console.error('[QuestCard] Failed to save quest map', err);
      }
    };

    const canvas = (
      <MapGraphLayout
        items={logs}
        edges={questData.taskGraph}
        onEdgesChange={handleEdgesSave}
      />
    );

    return (
      <div className="space-y-2">
        {selectedNode && (
          <div className="space-y-2">
            <TaskPreviewCard
              post={selectedNode}
              onUpdate={handleSelectedNodeUpdate}
              summaryOnly
            />
          </div>
        )}
        <div className="h-48 overflow-auto border-b border-secondary" data-testid="quest-map-canvas">
          {canvas}
        </div>
        <div className="text-right text-xs">
          <Link to={ROUTES.BOARD(`map-${quest.id}`)} className="underline text-accent">
            Open Canvas
          </Link>
        </div>
      </div>
    );
  };

  const renderFileView = () => {
    if (!selectedNode) return <div className="p-2 text-sm">Select a task</div>;
    const childIds = (questData.taskGraph || [])
      .filter((e) => e.from === selectedNode.id)
      .map((e) => e.to);
    const children = logs.filter((p) => childIds.includes(p.id));
    const isFolder = selectedNode.id === rootNode?.id || children.length > 0;

    const statusBoard = (
      <StatusBoardPanel
        questId={quest.id}
        linkedNodeId={selectedNode.id}
        initialOpen={false}
      />
    );

    const checklistSection = (
      <div className="border border-secondary rounded">
        <div
          className="flex justify-between items-center p-2 bg-soft cursor-pointer"
          onClick={() => setShowChecklist((p) => !p)}
        >
          <span className="font-semibold text-sm">Checklist</span>
          <span className="text-xs">{showChecklist ? '▲' : '▼'}</span>
        </div>
        {showChecklist && (
          <div className="p-2">
            <SubtaskChecklist questId={quest.id} nodeId={selectedNode.id} />
          </div>
        )}
      </div>
    );

    const folderSection = isFolder && (
      <div className="border border-secondary rounded">
        <div
          className="flex justify-between items-center p-2 bg-soft cursor-pointer"
          onClick={() => setShowFolderView((p) => !p)}
        >
          <span className="font-semibold text-sm">Folder Structure</span>
          <span className="text-xs">{showFolderView ? '▲' : '▼'}</span>
        </div>
        {showFolderView && (
          <div className="p-2 space-y-2">
            {showFolderForm && (
              <QuickTaskForm
                questId={quest.id}
                parentId={selectedNode.id}
                boardId={`task-${selectedNode.id}`}
                allowIssue
                onSave={(p) => {
                  setLogs((prev) => [...prev, p]);
                  setShowFolderForm(false);
                }}
                onCancel={() => setShowFolderForm(false)}
              />
            )}
            <div className="text-right">
              <button
                onClick={() => setShowFolderForm((p) => !p)}
                className="text-xs text-accent underline"
              >
                {showFolderForm ? '- Cancel' : '+ Add Item'}
              </button>
            </div>
            <div className="h-64 overflow-auto">
              <GraphLayout
                items={folderNodes}
                edges={folderEdges}
                questId={quest.id}
                condensed
                showInspector={false}
                showStatus={false}
                onNodeClick={(n) => {
                  if (n.id !== selectedNode.id) {
                    navigate(ROUTES.POST(n.id));
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    );

    const fileSection = (
      <div className="space-y-2">
        {selectedNode.taskType === 'file' && (
          <>
            <GitFileBrowserInline questId={quest.id} />
            {diffLoading ? null : diffData?.diffMarkdown && (
              <GitDiffViewer markdown={diffData.diffMarkdown} />
            )}
          </>
        )}
        <FileEditorPanel
          questId={quest.id}
          filePath={selectedNode.gitFilePath || 'file.txt'}
          content={selectedNode.content}
        />
      </div>
    );

    return (
      <div className="space-y-2 p-2">
        {statusBoard}
        {checklistSection}
        {folderSection}
        {selectedNode.taskType !== 'abstract' && fileSection}
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
                boardId={`log-${quest.id}`}
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
      case 'options':
        panel = selectedNode || rootNode ? (
          <TeamPanel questId={quest.id} node={selectedNode || (rootNode as Post)} />
        ) : (
          <div className="p-2 text-sm">Select a task</div>
        );
        break;
      default:
        panel = null;
    }

    return (
      <>
        <div className="border-b border-secondary flex text-sm overflow-x-auto whitespace-nowrap">
          {tabOptions.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value as typeof activeTab)}
              className={`px-3 py-1 -mb-px border-b-2 ${
                activeTab === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {panel}
      </>
    );
  };

  return (
    <div className="border border-secondary rounded-lg shadow bg-surface p-6 text-primary">
      {renderHeader()}
      {!expanded && (
        <div className="text-sm text-secondary space-y-1 mb-2">
          {shortDesc && <p>{shortDesc}</p>}
          <div className="text-xs space-y-0.5">
            <div>Rank: {rank}</div>
            <div>Difficulty: {difficulty}</div>
            <div>Reward: {reward}</div>
            {roles && <div>Roles Needed: {roles}</div>}
          </div>
          {user && RANK_ORDER[userRank] < (RANK_ORDER[rank] ?? 0) && (
            <div className="text-red-500 text-xs">Requires {rank} rank. Your rank: {userRank}. Level up to join.</div>
          )}
        </div>
      )}
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
      </div>
        {expanded && (
          <div className="flex flex-col md:flex-row gap-4 max-h-[420px] overflow-y-auto">
            <div
              className="overflow-auto md:pl-4 max-h-[420px]"
              style={{ width: mapWidth }}
            >
              {renderMap()}
            </div>
            <div
              className="hidden md:block w-1.5 bg-gray-200 dark:bg-gray-600 cursor-ew-resize"
              onMouseDown={handleDividerMouseDown}
            />
            <div className="flex-1 md:pr-4 md:border-r md:border-gray-300 dark:md:border-gray-700 overflow-auto max-h-[420px]">
              {renderRightPanel()}
            </div>
          </div>
        )}
    </div>
  );
};

export default QuestCard;
