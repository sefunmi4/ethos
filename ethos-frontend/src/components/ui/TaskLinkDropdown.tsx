import React, { useEffect, useState } from 'react';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { fetchAllPosts } from '../../api/post';
import type { Post } from '../../types/postTypes';

interface TaskLinkDropdownProps {
  onSelect: (taskId: string) => void;
  onClose: () => void;
}

interface TaskNode {
  id: string;
  title: string;
  children: TaskNode[];
}

const buildTree = (tasks: Post[]): TaskNode[] => {
  const map: Record<string, TaskNode> = {};
  const roots: TaskNode[] = [];

  tasks.forEach((t) => {
    const label = t.title || t.content.slice(0, 30);
    const key = t.nodeId || t.id;
    map[key] = { id: t.id, title: label, children: [] };
  });

  tasks.forEach((t) => {
    const key = t.nodeId || t.id;
    const parts = key.split(':');
    parts.pop();
    const parentKey = parts.join(':');
    const parent = map[parentKey];
    if (parent) {
      parent.children.push(map[key]);
    } else {
      roots.push(map[key]);
    }
  });

  return roots;
};

const TaskLinkDropdown: React.FC<TaskLinkDropdownProps> = ({ onSelect, onClose }) => {
  const [tree, setTree] = useState<TaskNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAllPosts()
      .then((posts) => {
        const tasks = posts.filter((p) => p.type === 'task');
        setTree(buildTree(tasks));
      })
      .catch((err) => console.error('[TaskLinkDropdown] failed to load tasks', err));
  }, []);

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderNode = (node: TaskNode): React.ReactNode => (
    <li key={node.id} className="pl-2">
      <div
        className="flex items-center cursor-pointer" 
        onClick={() => { onSelect(node.id); onClose(); }}
      >
        {node.children.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(node.id); }}
            className="mr-1"
          >
            {expanded[node.id] ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        )}
        <span className="truncate">{node.title}</span>
      </div>
      {node.children.length > 0 && expanded[node.id] && (
        <ul className="ml-4">
          {node.children.map((child) => renderNode(child))}
        </ul>
      )}
    </li>
  );

  return (
    <div className="absolute left-full top-0 ml-1 w-64 max-h-64 overflow-auto border rounded bg-white bg-surface dark:bg-background shadow">
      <ul className="text-sm p-2">
        {tree.map((n) => renderNode(n))}
      </ul>
    </div>
  );
};

export default TaskLinkDropdown;
