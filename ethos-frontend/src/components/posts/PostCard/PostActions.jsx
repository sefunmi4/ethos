import React from 'react';

const PostActions = ({ post, user }) => {
  const handleReply = () => {
    console.log('Reply to post', post.id);
  };

  const handleLike = () => {
    console.log('Like post', post.id);
  };

  const handleRepost = () => {
    console.log('Repost post', post.id);
  };

  return (
    <div className="flex gap-4 text-sm text-gray-600">
      <button onClick={handleReply} className="hover:text-indigo-600">
        💬 Reply
      </button>
      <button onClick={handleLike} className="hover:text-indigo-600">
        👍 Like
      </button>
      <button onClick={handleRepost} className="hover:text-indigo-600">
        🔁 Repost
      </button>
    </div>
  );
};

export default PostActions;