import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostCardList from './PostCardList';

const QuestCard = ({ 
  quest, 
  latestLog, 
  setPosts, 
  user,
  compact = false,
  isEditing = false,
  onEdit = () => {},
  onCancel = () => {},
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer border border-gray-100"
      onClick={() => navigate(`/quest/${quest.id}`)}
    >
      <div className="p-4">
        {/* 🧭 Quest Title & Status */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-indigo-700">{quest.title}</h3>
          <span className="text-xs uppercase text-gray-500 tracking-wider">
            {quest.status}
          </span>
        </div>

        {/* 📝 Latest Log Preview (optional) */}
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
    </div>
  );
};

export default QuestCard;