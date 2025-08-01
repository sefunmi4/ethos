import React from 'react';
import clsx from 'clsx';
import type { Post } from '../../types/postTypes';

export type NodeVisualType =
  | 'project'
  | 'quest'
  | 'task'
  | 'subtask'
  | 'request-open'
  | 'request-accepted';

interface NodeStyle {
  label: string;
  bgClass: string;
  textClass: string;
  bgColor: string;
  textColor: string;
}

const NODE_STYLES: Record<NodeVisualType, NodeStyle> = {
  project: {
    label: 'P',
    bgClass: 'bg-blue-200',
    textClass: 'text-blue-800',
    bgColor: '#bfdbfe',
    textColor: '#1e3a8a',
  },
  quest: {
    label: 'Q',
    bgClass: 'bg-purple-200',
    textClass: 'text-purple-800',
    bgColor: '#e9d5ff',
    textColor: '#5b21b6',
  },
  task: {
    label: 'T',
    bgClass: 'bg-orange-200',
    textClass: 'text-orange-800',
    bgColor: '#fed7aa',
    textColor: '#9a3412',
  },
  subtask: {
    label: 'C',
    bgClass: 'bg-rose-200',
    textClass: 'text-rose-800',
    bgColor: '#fecdd3',
    textColor: '#9f1239',
  },
  'request-open': {
    label: 'R+',
    bgClass: 'bg-yellow-200',
    textClass: 'text-yellow-800',
    bgColor: '#fef08a',
    textColor: '#854d0e',
  },
  'request-accepted': {
    label: 'R✓',
    bgClass: 'bg-green-200',
    textClass: 'text-green-800',
    bgColor: '#bbf7d0',
    textColor: '#166534',
  },
};

export function getNodeVisualType(post: Post): NodeVisualType {
  if (post.type === 'request') {
    return post.needsHelp === false ? 'request-accepted' : 'request-open';
  }
  if (post.type === 'quest') {
    return (post.tags || []).includes('project') ? 'project' : 'quest';
  }
  if (post.type === 'task') return 'task';
  if (post.type === 'commit' || post.type === 'log' || post.type === 'issue') return 'subtask';
  return 'task';
}

export function getNodeStyle(post: Post): NodeStyle {
  return NODE_STYLES[getNodeVisualType(post)];
}

const NodeTypeBadge: React.FC<{ post: Post; className?: string }> = ({ post, className }) => {
  const style = getNodeStyle(post);
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full w-5 h-5 text-xs font-bold select-none',
        style.bgClass,
        style.textClass,
        className
      )}
    >
      {style.label}
    </span>
  );
};

export default NodeTypeBadge;
