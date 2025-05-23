import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../posts/PostCard';

const QuestCard = ({
  quest,
  latestLog,
  setPosts,
  user,
  compact = false,
  isEditing = false,
  onEdit = () => {},
  onCancel = () => {},
  readOnly = false,
}) => {
  const navigate = useNavigate();
  const [joinStatus, setJoinStatus] = useState(
    quest.collaborators?.includes(user?.id) ? 'joined' : 'idle'
  );
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (readOnly || loading || !user?.id) return;

    setLoading(true);

    try {
      if (joinStatus === 'joined') {
        await axios.post(`/api/collab/leave/${quest.id}`);
        setJoinStatus('idle');
      } else {
        await axios.post(`/api/collab/join/${quest.id}`);
        setJoinStatus('joined');
      }
    } catch (err) {
      console.error('Failed to update quest membership:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderJoinButton = () => {
    if (readOnly || !user?.id) return null;

    let label = 'Join Quest';
    if (joinStatus === 'joined') label = 'Joined';
    else if (loading) label = '...';
    else if (joinStatus === 'pending') label = 'Pending...';

    return (
      <button
        onClick={handleJoin}
        disabled={loading}
        className={`text-xs px-3 py-1 rounded border font-medium transition whitespace-nowrap ${
          joinStatus === 'joined'
            ? 'bg-green-600 text-white'
            : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-md transition border border-gray-100 cursor-pointer"
      onClick={() => navigate(`/quest/${quest.id}`)}
    >
      <div className="p-4">
        {/* 🧭 Quest Title & Status */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-indigo-700 group-hover:underline">
            {quest.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-gray-500 tracking-wider">
              {quest.status}
            </span>
            {renderJoinButton()}
          </div>
        </div>

        {/* 📜 Quest Summary (if no latest log) */}
        {!latestLog && quest.summary && (
          <p className="text-sm text-gray-700 line-clamp-3">{quest.summary}</p>
        )}

        {/* 📝 Latest Quest Log (if present) */}
        {latestLog && (
          <div className="mt-2">
            <PostCard
              post={latestLog}
              user={user}
              setPosts={setPosts}
              compact={compact}
              isEditing={isEditing}
              onEdit={onEdit}
              onCancel={onCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestCard;