import React, { useState } from 'react';
import axios from 'axios';
import PostHeader from './PostHeader';
import PostFooterMenu from './PostFooterMenu';
import PostActions from './PostActions';
import PostMetaBar from './PostMetaBar';
import PostEditor from '../PostEditor';
import RepostModal from '../RepostModal';
import { formatDistanceToNow } from 'date-fns';

const typeStyles = {
  free_speech: 'bg-blue-50 text-blue-700',
  request: 'bg-yellow-50 text-yellow-800',
  quest_log: 'bg-green-50 text-green-800',
  quest_task: 'bg-purple-50 text-purple-800',
};

const typeLabels = {
  free_speech: '🗣️ Free Speech',
  request: '📝 Request',
  quest_log: '📜 Quest Log',
  quest_task: '⚔️ Quest Task',
};

const PostCard = ({
  post,
  user,
  setPosts,
  compact = false,
  isEditing = false,
  onEdit = () => {},
  onCancel = () => {},
}) => {
  const [editing, setEditing] = useState(isEditing);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    setEditing(false);
    onCancel();
  };

  const handleSave = (updated) => {
    setEditing(false);
    setPosts?.((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    onEdit(updated);
  };

  const handleRepost = () => setShowRepostModal(true);

  const handleLink = () => {
    console.log('🔗 Open link editor for post:', post.id);
  };

  const handleAddRepost = async (draft) => {
    try {
      setLoading(true);
      const res = await axios.post(`/api/posts/${post.id}/repost`, draft);
      const newPost = res.data;
      setPosts?.((prev) => [newPost, ...prev]);
    } catch (err) {
      console.error('❌ Repost failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <PostEditor post={post} onCancel={handleCancel} onSave={handleSave} />
      </div>
    );
  }

  const styleClass = typeStyles[post.type] || 'bg-gray-50 text-gray-700';
  const label = typeLabels[post.type] || post.type;
  const timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });

  return (
    <article className="border border-gray-200 rounded-lg bg-white overflow-hidden relative">
      <div className={`px-4 py-2 text-xs font-semibold ${styleClass}`}>{label}</div>

      <PostHeader post={post} user={user} compact={compact} />

      <div className="p-4 text-gray-800 text-sm whitespace-pre-wrap">
        {post.content}
      </div>

      <PostMetaBar post={post} />

      <div className="px-4 text-xs text-gray-400 italic pb-2">{timeAgo}</div>

      <div className="flex items-center justify-between px-4 py-2 border-t">
        <PostActions post={post} user={user} />
        <PostFooterMenu
          post={post}
          onEdit={handleEdit}
          onDelete={() => setPosts?.((prev) => prev.filter((p) => p.id !== post.id))}
          onRepost={handleRepost}
          onLink={handleLink}
        />
      </div>

      {showRepostModal && (
        <RepostModal
          originalPost={post}
          onClose={() => setShowRepostModal(false)}
          onRepost={handleAddRepost}
        />
      )}
    </article>
  );
};

export default PostCard;