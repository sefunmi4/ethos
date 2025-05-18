// components/PostCardList.jsx

import React, { useState } from 'react';
import PostCard from './PostCard';

const PostCardList = ({
  posts = [],
  user,
  setPosts = () => {},
  emptyMessage = 'No posts available.',
  compact = false,
  allowEdit = true, 
}) => {
  const [editingPostId, setEditingPostId] = useState(null);

  if (!posts || posts.length === 0) {
    return <p className="text-gray-500 text-sm italic">{emptyMessage}</p>;
  }

  const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <ul className="space-y-4">
      {sortedPosts.map(post => (
        <li key={post.id} className="bg-white rounded shadow-sm border border-gray-100 p-0">
          <PostCard
            post={post}
            user={user}
            setPosts={setPosts}
            compact={compact}
            isEditing={editingPostId === post.id}
            onEdit={(id) => setEditingPostId(id)}
            onCancel={() => setEditingPostId(null)}
            allowEdit={allowEdit}
          />
        </li>
      ))}
    </ul>
  );
};

export default PostCardList;