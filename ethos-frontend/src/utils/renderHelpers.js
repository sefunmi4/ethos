// utils/renderHelpers.js

import { formatDistanceToNowStrict } from 'date-fns';

/**
 * Renders a component or layout based on structure type.
 * Useful for boards, quest views, threads, timelines, etc.
 */
export function renderByStructureType(type, data) {
  switch (type) {
    case 'list':
      return renderAsList(data);
    case 'grid':
      return renderAsGrid(data);
    case 'timeline':
      return renderAsTimeline(data);
    case 'thread':
      return renderAsThread(data);
    default:
      console.warn(`[renderByStructureType] Unknown structure: ${type}`);
      return renderAsList(data);
  }
}

// Placeholder implementations – replace with real components or JSX render logic.
function renderAsList(data) {
  return data.map(item => <div key={item.id}>{item.title || item.content}</div>);
}

function renderAsGrid(data) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {data.map(item => (
        <div key={item.id} className="border p-2 rounded shadow-sm">
          {item.title || item.content}
        </div>
      ))}
    </div>
  );
}

function renderAsTimeline(data) {
  return (
    <ul className="border-l border-gray-300 pl-4 space-y-4">
      {data.map(item => (
        <li key={item.id}>
          <p className="text-sm text-gray-600">{formatTimeAgo(item.timestamp)}</p>
          <p>{item.title || item.content}</p>
        </li>
      ))}
    </ul>
  );
}

function renderAsThread(data) {
  return data.map(item => (
    <div key={item.id} className="border-l-2 pl-4 mb-4">
      <p className="text-xs text-gray-500">{formatTimeAgo(item.timestamp)}</p>
      <p>{item.content}</p>
    </div>
  ));
}

/**
 * Formats a timestamp to a readable "time ago" string.
 * @example "5 minutes ago"
 */
export function formatTimeAgo(timestamp) {
  try {
    return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
  } catch {
    return 'Just now';
  }
}

/**
 * Truncates a string to a max length with ellipsis
 */
export function truncateText(text, maxLength = 140) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}