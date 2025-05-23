import React from 'react';
import { useNavigate } from 'react-router-dom';

const PostMetaBar = ({ post }) => {
  const navigate = useNavigate();

  const handleLinkQuest = () => {
    // This could trigger inline edit mode or navigation
    console.log('Prompt user to link post to a quest.');
  };

  return (
    <div className="px-4 pb-2 text-xs text-gray-500 flex flex-wrap gap-4 items-center">
      {post.tags?.length > 0 && (
        <div className="flex gap-1 items-center">
          <span className="font-semibold">Tags:</span>
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {post.questId ? (
        <button
          onClick={() => navigate(`/quest/${post.questId}`)}
          className="text-indigo-600 hover:underline whitespace-nowrap"
        >
          🔗 Linked to Quest #{post.questId} — View & Contribute
        </button>
      ) : (
        <button
          onClick={handleLinkQuest}
          className="text-gray-500 hover:underline whitespace-nowrap"
        >
          ➕ Link this post to a new or existing quest
        </button>
      )}
    </div>
  );
};

export default PostMetaBar;
