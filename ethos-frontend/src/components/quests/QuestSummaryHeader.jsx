import React, { useState } from 'react';
import PostTypeTag from '../posts/PostTypeTag';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

/**
 * QuestSummaryHeader shows top-level metadata for a quest:
 * title, description, status, collaborators, tags, and join/leave button.
 */
const QuestSummaryHeader = ({ quest, onRefresh }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(quest.collaborators?.includes(user?.id));
  const isAuthor = user?.id === quest.authorId;

  const handleToggleJoin = async () => {
    if (!user?.id || loading) return;

    try {
      setLoading(true);
      const route = isJoined ? 'leave' : 'join';
      await axios.post(`/api/collab/${route}/${quest.id}`);
      setIsJoined(!isJoined);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to join/leave quest:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold text-indigo-700 break-words">
          {quest.title || 'Untitled Quest'}
        </h1>

        <div className="flex items-center gap-3">
          <PostTypeTag type={quest.status || 'active'} />
          {!isAuthor && (
            <button
              onClick={handleToggleJoin}
              disabled={loading}
              className={`text-xs px-3 py-1 rounded font-medium transition ${
                isJoined
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              {loading ? '...' : isJoined ? 'Leave Quest' : 'Join Quest'}
            </button>
          )}
        </div>
      </div>

      {quest.summary && (
        <p className="text-gray-700 text-md mb-4 max-w-4xl whitespace-pre-wrap">
          {quest.summary}
        </p>
      )}

      {quest.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {quest.tags.map((tag) => (
            <span
              key={tag}
              className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded whitespace-nowrap"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-500">
        {quest.collaborators?.length || 0} collaborator
        {quest.collaborators?.length !== 1 ? 's' : ''} joined
      </div>
    </div>
  );
};

export default QuestSummaryHeader;