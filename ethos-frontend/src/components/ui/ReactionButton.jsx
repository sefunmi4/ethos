import React, { useState } from 'react';
import { FaRegHeart, FaHeart, FaRegThumbsUp, FaThumbsUp } from 'react-icons/fa';
import clsx from 'clsx';

// Dummy logic — in production connect to backend state
const ReactionButton = ({ postId }) => {
  const [liked, setLiked] = useState(false);
  const [hearted, setHearted] = useState(false);

  const toggleLike = () => setLiked(!liked);
  const toggleHeart = () => setHearted(!hearted);

  return (
    <div className="flex gap-4 items-center text-sm text-gray-500">
      <button
        className={clsx('flex items-center gap-1', liked && 'text-blue-600')}
        onClick={toggleLike}
        aria-label="Thumbs up"
      >
        {liked ? <FaThumbsUp /> : <FaRegThumbsUp />} Like
      </button>

      <button
        className={clsx('flex items-center gap-1', hearted && 'text-red-500')}
        onClick={toggleHeart}
        aria-label="Heart"
      >
        {hearted ? <FaHeart /> : <FaRegHeart />} React
      </button>
    </div>
  );
};

export default ReactionButton;