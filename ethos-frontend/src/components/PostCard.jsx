import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import PostHeader from './PostHeader';
import PostEditor from './PostEditor';
import PostFooterMenu from './PostFooterMenu';

const typeStyles = {
  free_speech: 'border-blue-300 bg-blue-50 text-blue-700',
  request: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  quest_log: 'border-green-400 bg-green-50 text-green-800',
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
  const [postState, setPostState] = useState(post);
  const [copied, setCopied] = useState(false);

  const [editedContent, setEditedContent] = useState(post.content || '');
  const [editedVisibility, setEditedVisibility] = useState(post.visibility || 'public');
  const [editedType, setEditedType] = useState(post.type || 'free_speech');
  const [editedQuestId, setEditedQuestId] = useState(post.questId || '');

  const menuRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  const editMode = isEditing;
  const timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
  const currentType = editMode ? editedType : post.type;
  const styleClass = typeStyles[currentType] || 'border-gray-300 bg-gray-50 text-gray-700';

  const isOwner = user?.id === post.authorId;
  const isCollaborator = post.type === 'quest_log' && post.collaborators?.includes(user?.id);
  
  // Hide menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleSave = async (updatedValues) => {
    try {
      const updatedPost = {
        content: updatedValues.content,
        visibility: updatedValues.visibility,
        type: updatedValues.type,
        questId: updatedValues.type === 'quest_log' ? updatedValues.questId : null,
      };
  
      const res = await fetch(`/api/posts/${postState.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedPost),
      });
  
      if (!res.ok) throw new Error('Failed to update post');
  
      const updated = await res.json();
  
      // If made private, remove it from view
      if (updated.visibility !== 'public') {
        setPosts(prev => prev.filter(p => p.id !== updated.id));
        return;
      }
  
      // Otherwise, update in place
      setPostState(updated);
      setPosts(prev =>
        prev.map(p => (p.id === updated.id ? updated : p))
      );
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/posts/${postState.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts((prev) => prev.filter((p) => p.id !== postState.id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleShare = () => {
    const permalink = `${window.location.origin}${window.location.pathname}#post-${postState.id}`;
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`post-${postState.id}`}
      className={`relative border-l-4 rounded-md px-4 py-3 ${styleClass} shadow-sm`}
    >
      <PostHeader
        type={currentType}
        timestamp={timeAgo}
        authorId={postState.authorId}
        isOwner={user?.id === postState.authorId}
      />

      {editMode ? (
        <PostEditor
          mode="edit"
          user={user}
          quests={[]} // optional: pass if needed for title dropdown
          initialContent={editedContent}
          initialType={editedType}
          initialVisibility={editedVisibility}
          initialQuestId={editedQuestId}
          onSave={(updatedValues) => {
            handleSave(updatedValues);
            onCancel(); 
          }}
          onCancel={onCancel}
        />
      ) : (
        <p className={`text-sm ${compact ? 'truncate' : ''}`}>{postState.content}</p>
      )}

      {postState.tags?.length > 0 && !editMode && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {postState.tags.map((tag) => (
            <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {postState.questId && postState.type === 'quest_log' && !editMode && (
        <p className="text-xs text-gray-400 mt-2 italic">Linked to Quest: {postState.questId}</p>
      )}

      {copied && (
        <div className="absolute bottom-12 right-4 bg-green-600 text-white text-xs px-3 py-1 rounded shadow">
          Link copied!
        </div>
      )}

      <PostFooterMenu
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        menuRef={menuRef}
        onEdit={() => {
          setEditedContent(postState.content);
          setEditedVisibility(postState.visibility);
          setEditedType(postState.type);
          setEditedQuestId(postState.questId || '');
          onEdit(postState.id); 
          setShowMenu(false);
        }}
        onDelete={() => {
          handleDelete();
          setShowMenu(false);
        }}
        onShare={handleShare}
        isOwner={isOwner}
        isCollaborator={isCollaborator}
      />
    </div>
  );
};

export default PostCard;