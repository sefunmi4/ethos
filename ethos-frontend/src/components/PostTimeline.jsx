import React, { useState } from 'react';
import PostCardList from './PostCardList';

const PostTimeline = ({ user, posts = [], setPosts, emptyMessage = 'No posts available.' }) => {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const filteredPosts = posts
    .filter(post => {
      const matchesType = filter ? post.type === filter : true;
      const matchesSearch = search
        ? post.content.toLowerCase().includes(search.toLowerCase()) ||
          (post.tags || []).some(tag =>
            tag.toLowerCase().includes(search.toLowerCase())
          )
        : true;
      return matchesType && matchesSearch;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="mt-4">
      {/* 🔍 Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded p-1 text-sm"
        >
          <option value="">All Types</option>
          <option value="quest_log">Quest Log</option>
          <option value="request">Request</option>
          <option value="free_speech">Free Speech</option>
        </select>

        <input
          type="text"
          placeholder="Search content or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded p-1 text-sm"
        />
      </div>

      {/* 📝 Post Feed */}
      {filteredPosts.length === 0 ? (
        <p className="text-gray-500 text-sm">No posts found.</p>
      ) : (
        <ul className="space-y-4">
          <PostCardList
            posts={filteredPosts}
            user={user}
            setPosts={setPosts}
            emptyMessage={emptyMessage}
          />
        </ul>
      )}
    </div>
  );
};

export default PostTimeline;