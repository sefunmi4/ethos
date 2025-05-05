import React, { useState } from 'react';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

const ReactionButton = ({ type = 'upvote', count = 0, onReact }) => {
  const [reacted, setReacted] = useState(false);

  const handleClick = () => {
    if (onReact) {
      onReact(type, !reacted); // notify parent component
    }
    setReacted(!reacted);
  };

  const getIcon = () => {
    if (type === 'upvote') return <FaThumbsUp />;
    if (type === 'downvote') return <FaThumbsDown />;
    return <span>👍</span>; // fallback icon
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md border 
        ${reacted ? 'bg-blue-100 border-blue-400 text-blue-600' : 'bg-white border-gray-300 text-gray-600'} 
        hover:bg-blue-50 transition`}
    >
      {getIcon()}
      <span>{count + (reacted ? 1 : 0)}</span>
    </button>
  );
};

export default ReactionButton;