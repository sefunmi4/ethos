import React from 'react';
import { Link } from 'react-router-dom';
import PostTypeTag from '../posts/PostTypeTag';

const BoardItemCard = ({ data, title, subtitle }) => {
  if (!data) return null;

  const type = data.type || subtitle || 'item';
  const id = data.id || '';
  const link = id ? (type === 'quest' ? `/quest/${id}` : `/post/${id}`) : '#';
  const displayTitle = title || data.title || 'Untitled';
  const summary = data.summary || data.content || '';
  const author = data.author?.username || data.author?.name;
  const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleDateString() : null;

  return (
    <Link
      to={link}
      className="block group hover:shadow-md transition rounded-lg border border-gray-200 bg-white p-4"
    >
      {/* Top bar: title + type */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 truncate">
          {displayTitle}
        </h3>
        {data.type && <PostTypeTag type={data.type} />}
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-sm text-gray-600 line-clamp-3">{summary}</p>
      )}

      {/* Author / Timestamp */}
      {(author || timestamp) && (
        <p className="mt-3 text-xs text-gray-400">
          {author && <>By {author}</>} {author && timestamp && ' • '}
          {timestamp && <>{timestamp}</>}
        </p>
      )}
    </Link>
  );
};

export default BoardItemCard;