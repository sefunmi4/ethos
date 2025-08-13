import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapGraphLayout from '../layout/MapGraphLayout';
import GraphLayout from '../layout/GraphLayout';
import { useGraph } from '../../hooks/useGraph';
import QuestNodeInspector from './QuestNodeInspector';
import TaskPreviewCard from '../post/TaskPreviewCard';
import SummaryTag from '../ui/SummaryTag';
import { buildSummaryTags, type SummaryTagData } from '../../utils/displayUtils';
import StatusBoardPanel from './StatusBoardPanel';
import QuickTaskForm from '../post/QuickTaskForm';
import SubtaskChecklist from './SubtaskChecklist';
import FileEditorPanel from './FileEditorPanel';
import GitDiffViewer from '../git/GitDiffViewer';
import { useGitDiff } from '../../hooks/useGit';
import { updateQuestTaskGraph } from '../../api/quest';
import { updatePost } from '../../api/post';
import { ROUTES } from '../../constants/routes';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import type { TaskEdge } from '../../types/questTypes';
import { MarkdownEditor, MarkdownRenderer } from '../ui';

interface TaskCardProps {
  task: Post;
  questId: string;
  user?: User;
  onUpdate?: (p: Post) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, questId, user, onUpdate }) => {
  const { nodes, edges, loadGraph } = useGraph();
  const [selected, setSelected] = useState<Post>(task);
  const [detailWidth, setDetailWidth] = useState<number>(400);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showFolderView, setShowFolderView] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [editingPlanner, setEditingPlanner] = useState(false);
  const [plannerDraft, setPlannerDraft] = useState(task.content);
  const navigate = useNavigate();
  const isHeadNode = task.nodeId?.endsWith('T00');
  const isRootSelected = selected.nodeId?.endsWith('T00');

  const handleNodeUpdate = (updated: Post) => {
    setSelected(updated);
    onUpdate?.(updated);
  };

  useEffect(() => {
    setSelected(task);
  }, [task]);

  useEffect(() => {
    if (questId) {
      loadGraph(questId);
    }
  }, [questId, loadGraph]);

  useEffect(() => {
    setPlannerDraft(selected.content);
    setEditingPlanner(false);
  }, [selected.id, selected.content]);

  useEffect(() => {
    if (!isHeadNode) return;
    const handleTaskOpen = (e: Event) => {
      const { taskId } = (e as CustomEvent<{ taskId: string }>).detail;
      const node = nodes.find((n) => n.id === taskId);
      if (node) setSelected(node);
    };
    window.addEventListener('questTaskOpen', handleTaskOpen);
    return () => window.removeEventListener('questTaskOpen', handleTaskOpen);
  }, [isHeadNode, nodes]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { task: updated } = (e as CustomEvent<{ task: Post }>).detail;
      if (selected.id === updated.id) setSelected({ ...selected, ...updated });
    };
    window.addEventListener('taskUpdated', handler);
    return () => window.removeEventListener('taskUpdated', handler);
  }, [selected]);

  const handleEdgesSave = async (edgesToSave: TaskEdge[]) => {
    try {
      await updateQuestTaskGraph(questId, edgesToSave);
      await loadGraph(questId);
    } catch (err) {
      console.error('[TaskCard] Failed to save task graph', err);
    }
  };

  const handlePlannerSave = async () => {
    try {
      const updated = await updatePost(selected.id, { content: plannerDraft });
      setSelected(updated);
      onUpdate?.(updated);
      document.dispatchEvent(
        new CustomEvent('taskUpdated', { detail: { task: updated }, bubbles: true })
      );
      setEditingPlanner(false);
    } catch (err) {
      console.error('[TaskCard] Failed to save planner', err);
    }
  };

  const subgraphIds = useMemo(() => {
    const ids = new Set<string>();
    const gatherChildren = (id: string) => {
      if (ids.has(id)) return; // Prevent infinite recursion on cyclical graphs
      ids.add(id);
      edges
        .filter((e) => e.from === id)
        .forEach((e) => gatherChildren(e.to));
    };
    gatherChildren(task.id);
    return ids;
  }, [task.id, edges]);

  const displayNodes = useMemo(() => nodes.filter(n => subgraphIds.has(n.id)), [nodes, subgraphIds]);
  const displayEdges = useMemo(() => edges.filter(e => subgraphIds.has(e.from) && subgraphIds.has(e.to)), [edges, subgraphIds]);

  const parentEdge = edges.find((e) => e.to === selected.id);
  const parentNode = parentEdge ? nodes.find((n) => n.id === parentEdge.from) : undefined;
  const [parentTag, setParentTag] = useState<SummaryTagData | undefined>(undefined);
  useEffect(() => {
    if (!isRootSelected && parentNode) {
      let active = true;
      buildSummaryTags(parentNode).then(tags => {
        if (active) setParentTag(tags.find(t => t.type === 'task'));
      });
      return () => {
        active = false;
      };
    }
    setParentTag(undefined);
    return undefined;
  }, [isRootSelected, parentNode]);

  const taskType = selected.taskType || 'abstract';
  const status = selected.status;

  const { data: diffData, isLoading: diffLoading } = useGitDiff({
    questId,
    filePath: selected.gitFilePath,
    commitId: selected.gitCommitSha,
  });


  const handleDividerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startWidth = detailWidth;
    const onMove = (ev: MouseEvent) => {
      const newWidth = Math.min(600, Math.max(260, startWidth - (ev.clientX - startX)));
      setDetailWidth(newWidth);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="border border-secondary rounded-lg bg-surface p-4 space-y-2">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2 md:pr-4" style={{ minWidth: 240 }}>
          <TaskPreviewCard post={selected} summaryOnly hideSummaryTag={!isRootSelected} />
          <div className="flex items-center justify-between gap-1">
            {parentNode && (
              <>
                <div
                  className="w-px h-4 border-l-2 border-dotted border-secondary cursor-pointer"
                  title={`Parent: ${parentNode.content.slice(0, 50)}`}
                  onClick={() => navigate(ROUTES.POST(parentNode.id))}
                />
                {parentTag && <SummaryTag {...parentTag} />}
              </>
            )}
          </div>
          <div className="h-64 overflow-auto" data-testid="task-map-inline">
            <MapGraphLayout
              items={displayNodes}
              edges={displayEdges}
              {...(!isHeadNode && {
                onNodeClick: (n: Post) => {
                  if (n.id !== task.id) navigate(ROUTES.POST(n.id));
                },
              })}
            />
          </div>
          {isHeadNode && (
            <div className="text-right text-xs">
              <Link to={ROUTES.BOARD(`map-${questId}`)} className="underline text-accent">
                Open Canvas
              </Link>
            </div>
          )}
        </div>
        <div className="hidden md:block w-1.5 bg-gray-200 dark:bg-gray-600 cursor-ew-resize" onMouseDown={handleDividerMouseDown} />
        <div className="overflow-auto" style={{ width: detailWidth }}>
          <QuestNodeInspector
            questId={questId}
            node={selected}
            user={user}
            showPost={false}
            onUpdate={handleNodeUpdate}
            status={status}
            hideSelects
          />
          <div className="space-y-2 p-2 mt-2">
            <StatusBoardPanel
              questId={questId}
              linkedNodeId={selected.id}
              initialOpen={false}
            />
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
                  <SubtaskChecklist questId={questId} nodeId={selected.id} />
                </div>
              )}
            </div>
            {(
              taskType === 'folder' ||
              selected.id === task.id ||
              displayEdges.some((e) => e.from === selected.id)
            ) && (
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
                        questId={questId}
                        parentId={selected.id}
                        boardId={`task-${selected.id}`}
                        onSave={() => setShowFolderForm(false)}
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
                        items={displayNodes}
                        edges={displayEdges}
                        questId={questId}
                        condensed
                        showInspector={false}
                        showStatus={false}
                        onEdgesChange={handleEdgesSave}
                        onNodeClick={(n) => {
                          if (n.id !== task.id) {
                            navigate(ROUTES.POST(n.id));
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {selected.planner && (
              <div className="border border-secondary rounded">
                <div className="flex justify-between items-center p-2 bg-soft">
                  <span className="font-semibold text-sm">Planner</span>
                  <button
                    onClick={() => setEditingPlanner((p) => !p)}
                    className="text-xs text-accent underline"
                  >
                    {editingPlanner ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                <div className="p-2 space-y-2">
                  {editingPlanner ? (
                    <>
                      <MarkdownEditor
                        id={`planner-${selected.id}`}
                        value={plannerDraft}
                        onChange={setPlannerDraft}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handlePlannerSave}
                          className="bg-accent text-white text-xs px-2 py-1 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPlanner(false);
                            setPlannerDraft(selected.content);
                          }}
                          className="text-xs underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <MarkdownRenderer content={selected.content} />
                  )}
                </div>
              </div>
            )}
            {taskType !== 'abstract' && (
              <div className="space-y-2">
                {taskType === 'file' &&
                  (diffLoading ? null : diffData?.diffMarkdown && (
                    <GitDiffViewer markdown={diffData.diffMarkdown} />
                  ))}
                <FileEditorPanel
                  questId={questId}
                  filePath={selected.gitFilePath || 'file.txt'}
                  content={selected.content}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
