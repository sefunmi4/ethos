import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useGitDiff } from "../../hooks/useGit";
import { Spinner } from "../ui";
import GraphNode from "./GraphNode";
import QuestNodeInspector from "../quest/QuestNodeInspector";
import type { User } from "../../types/userTypes";
import type { Post } from "../../types/postTypes";

import type { TaskEdge } from "../../types/questTypes";

interface GraphLayoutProps {
  items: Post[];
  edges?: TaskEdge[];
  user?: User;
  questId: string;
  compact?: boolean;
  /** Render a simplified node representation */
  condensed?: boolean;
  /** Show status dropdowns for tasks */
  showStatus?: boolean;
  /** Display side inspector panel */
  showInspector?: boolean;
  /** Notify parent when a node is selected */
  onSelectNode?: (n: Post) => void;
  /** Notify parent when edges change */
  onEdgesChange?: (edges: TaskEdge[]) => void;
  onScrollEnd?: () => void;
  loadingMore?: boolean;
  boardId?: string;
}

interface NodeChild {
  node: Post;
  edge?: TaskEdge;
}

interface NodeMap {
  [id: string]: Post & { children?: NodeChild[] };
}

const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => fn(...args), delay);
  };
};

const GraphLayout: React.FC<GraphLayoutProps> = ({
  items,
  edges,
  user,
  questId,
  compact = false,
  condensed = false,
  showStatus = true,
  showInspector = true,
  onSelectNode,
  onEdgesChange,
  onScrollEnd,
  loadingMore = false,
  boardId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<{ key: string; d: string; type?: string }[]>([]);

  const [localItems, setLocalItems] = useState<Post[]>(items);
  const [rootNodes, setRootNodes] = useState<
    (Post & { children?: NodeChild[] })[]
  >([]);
  const [edgeList, setEdgeList] = useState<TaskEdge[]>(edges || []);
  const [selectedNode, setSelectedNode] = useState<Post | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const activeNode = activeNodeId
    ? localItems.find((it) => it.id === activeNodeId) || null
    : null;

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const { data: diffData, isLoading: diffLoading } = useGitDiff({
    questId,
    filePath: selectedNode?.gitFilePath,
    commitId: selectedNode?.gitCommitSha,
  });

  const computePaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const newPaths: { key: string; d: string; type?: string }[] = [];
    edgeList.forEach((edge) => {
      const fromEl = nodeRefs.current[edge.from];
      const toEl = nodeRefs.current[edge.to];
      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const startX =
          fromRect.left +
          fromRect.width / 2 -
          containerRect.left +
          container.scrollLeft;
        const startY =
          fromRect.bottom - containerRect.top + container.scrollTop;
        const endX =
          toRect.left +
          toRect.width / 2 -
          containerRect.left +
          container.scrollLeft;
        const endY = toRect.top - containerRect.top + container.scrollTop;
        newPaths.push({
          key: `${edge.from}-${edge.to}`,
          d: `M ${startX} ${startY} L ${endX} ${endY}`,
          type: edge.type,
        });
      }
    });
    setPaths(newPaths);
  }, [edgeList]);

  const debouncedComputePaths = useRef<() => void>(() => {});

  useEffect(() => {
    debouncedComputePaths.current = debounce(computePaths, 50);
  }, [computePaths]);

  useLayoutEffect(() => {
    computePaths();
  }, [rootNodes, edgeList, computePaths]);

  useEffect(() => {
    window.addEventListener("resize", computePaths);
    return () => window.removeEventListener("resize", computePaths);
  }, [computePaths]);

  useEffect(() => {
    const nodeMap: NodeMap = {};
    const roots: (Post & { children?: NodeChild[] })[] = [];

    localItems.forEach((item) => {
      nodeMap[item.id] = { ...item, children: [] };
    });

    if (edgeList && edgeList.length > 0) {
      const hierarchical = edgeList.filter((e) => e.type !== 'abstract');
      const toIds = new Set(hierarchical.map((e) => e.to));
      hierarchical.forEach((edge) => {
        const fromNode = nodeMap[edge.from];
        const toNode = nodeMap[edge.to];
        if (fromNode && toNode) {
          fromNode.children!.push({ node: toNode, edge });
        }
      });

      Object.values(nodeMap).forEach((node) => {
        if (!toIds.has(node.id)) {
          roots.push(node);
        }
      });
    } else {
      localItems.forEach((item) => {
        const parentId = item.replyTo || item.repostedFrom?.originalPostId;
        if (parentId && nodeMap[parentId]) {
          nodeMap[parentId].children!.push({ node: nodeMap[item.id] });
        } else {
          roots.push(nodeMap[item.id]);
        }
      });
    }

    setRootNodes(roots);
  }, [localItems, edgeList]);

  useEffect(() => {
    setEdgeList(edges || []);
  }, [edges]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      debouncedComputePaths.current();
      if (!onScrollEnd) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onScrollEnd();
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [onScrollEnd]);

  const handleNodeClick = (n: Post) => {
    setSelectedNode(n);
    setActiveNodeId((prev) => (prev === n.id ? null : n.id));
    onSelectNode?.(n);
    window.dispatchEvent(
      new CustomEvent("questTaskSelect", { detail: { taskId: n.id } }),
    );
  };

  const handleNodeFocus = (id: string) => {
    setFocusedNodeId(id);
  };

  const isDescendant = (parentId: string, childId: string): boolean => {
    const visited = new Set<string>();
    const stack = [parentId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === childId) return true;
      edgeList
        .filter((e) => e.from === current && e.type !== 'abstract')
        .forEach((e) => {
          if (!visited.has(e.to)) {
            visited.add(e.to);
            stack.push(e.to);
          }
        });
    }
    return false;
  };

  const handleRemoveEdge = (edge: TaskEdge) => {
    setEdgeList((prev) => {
      const updated = prev.filter((e) => !(e.from === edge.from && e.to === edge.to));
      if (updated !== prev) onEdgesChange?.(updated);
      return updated;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    const id = active.id as string;

    if (id.startsWith("anchor-")) {
      const parentId = id.slice(7);
      const newId = `new-${Date.now()}`;
      const newNode: Post = {
        id: newId,
        type: "task",
        content: "New Task",
        authorId: "",
        visibility: "public",
        timestamp: "",
        tags: [],
        collaborators: [],
        linkedItems: [],
      };
      setLocalItems((prev) => [...prev, newNode]);
      setEdgeList((prev) => {
        const updated = [...prev, { from: parentId, to: newId }];
        onEdgesChange?.(updated);
        return updated;
      });
      return;
    }

    const targetId = over ? (over.id as string) : null;

    const nodeId = id.startsWith("move-") ? id.slice(5) : id;

    if (!targetId) {
      setEdgeList((prev) => {
        const updated = prev.filter((e) => e.to !== nodeId);
        if (updated !== prev) onEdgesChange?.(updated);
        return updated;
      });
      return;
    }

    if (nodeId === targetId) return;

    if (isDescendant(nodeId, targetId)) {
      setEdgeList((prev) => {
        const exists = prev.some(
          (e) => e.from === targetId && e.to === nodeId && e.type === 'abstract'
        );
        if (exists) return prev;
        const updated = [...prev, { from: targetId, to: nodeId, type: 'abstract' }];
        onEdgesChange?.(updated);
        return updated;
      });
      return;
    }

    setEdgeList((prev) => {
      const filtered = prev.filter((e) => e.to !== nodeId);
      const exists = filtered.some(
        (e) => e.from === targetId && e.to === nodeId,
      );
      const updated = exists ? filtered : [...filtered, { from: targetId, to: nodeId }];
      if (updated !== prev) onEdgesChange?.(updated);
      return updated;
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        ref={containerRef}
        className={
          "overflow-auto w-full h-full p-4 max-w-7xl mx-auto " +
          (rootNodes.length === 1 ? "flex justify-center" : "")
        }
        style={{ minHeight: "24vh", maxHeight: "40vh", position: "relative" }}
      >
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#aaa" />
            </marker>
          </defs>
          {paths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              stroke={p.type === 'abstract' ? '#f97316' : '#aaa'}
              strokeDasharray={p.type === 'abstract' ? '4 2' : undefined}
              fill="none"
              markerEnd="url(#arrow)"
            />
          ))}
        </svg>
        {rootNodes.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            depth={0}
            user={user}
            compact={compact}
            condensed={condensed}
            showStatus={showStatus}
            focusedNodeId={focusedNodeId}
            onFocus={handleNodeFocus}
            selectedNode={selectedNode}
            onSelect={handleNodeClick}
            onRemoveEdge={handleRemoveEdge}
            diffData={diffData}
            diffLoading={diffLoading}
            registerNode={(id, el) => {
              nodeRefs.current[id] = el;
            }}
            boardId={boardId}
          />
        ))}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
      </div>
      {showInspector && (
        <div
          className={
            'fixed top-0 right-0 h-full w-80 bg-surface dark:bg-background shadow-lg transform transition-transform duration-300 ' +
            (activeNodeId ? 'translate-x-0' : 'translate-x-full')
          }
          data-testid="quest-node-inspector"
        >
          {activeNode && (
            <QuestNodeInspector
              questId={questId}
              node={activeNode}
              user={user}
            />
          )}
        </div>
      )}
    </DndContext>
  );
};

export default GraphLayout;
