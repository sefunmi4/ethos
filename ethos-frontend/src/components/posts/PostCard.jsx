import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaEllipsisH, FaLink, FaArchive, FaTrash, FaEdit } from 'react-icons/fa';
import EditPost from './EditPost';
import { PostTypeBadge, ReactionButton } from '../ui';
import LinkToItemModal from '../ui/LinkToItemModal';
import { axiosWithAuth } from '../../utils/authUtils';
import { useBoardContext } from '../../contexts/BoardContext';

const PostCard = ({ post, user, onUpdate, onDelete, compact = false }) => {
  const [editMode, setEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const { selectedBoard, removeFromBoard, updateBoardItem } = useBoardContext() || {};

  const canEdit = user?.id === post.authorId || (post.collaborators || []).includes(user?.id);
  const hasLink = post.links && post.links.length > 0;
  const canLink = post.type === 'request' && user;

  const timestamp = post.timestamp
    ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
    : 'Unknown time';

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;

    try {
      await axiosWithAuth.delete(`/posts/${post.id}`);
      if (selectedBoard?.id) removeFromBoard(selectedBoard.id, post.id);
      onDelete?.(post.id);
    } catch (err) {
      console.error('[PostCard] Failed to delete post:', err);
      alert('Error deleting post.');
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this post? It will be hidden from boards but not deleted.')) return;

    try {
      setIsArchiving(true);
      const res = await axiosWithAuth.patch(`/posts/${post.id}`, { visibility: 'private' });
      const updatedPost = res.data;

      if (selectedBoard?.id) removeFromBoard(selectedBoard.id, post.id); // hide from UI
      updateBoardItem?.(selectedBoard?.id, updatedPost); // optional: move to archive view
      onUpdate?.(updatedPost);
    } catch (err) {
      console.error('[PostCard] Failed to archive post:', err);
      alert('Error archiving post.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
    alert('Link copied!');
  };

  const handleLinkNavigation = (link) => {
    if (link.type === 'quest') navigate(`/quests/${link.id}`);
    else if (link.type === 'project') navigate(`/projects/${link.id}`);
    else if (link.url) window.open(link.url, '_blank');
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMenu]);

  if (editMode) {
    return <EditPost post={post} onCancel={() => setEditMode(false)} onUpdated={onUpdate} />;
  }

  return (
    <div className="relative border rounded bg-white shadow-sm p-4 space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <PostTypeBadge type={post.type} />
          <span>{timestamp}</span>
        </div>

        <div ref={menuRef} className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="hover:text-gray-800">
            <FaEllipsisH />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border rounded shadow text-sm z-10">
              {canEdit && (
                <>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => setEditMode(true)}>
                    <FaEdit className="inline mr-2" /> Edit
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-red-100 text-red-600"
                    onClick={handleDelete}
                  >
                    <FaTrash className="inline mr-2" /> Delete
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                    onClick={handleArchive}
                    disabled={isArchiving}
                  >
                    <FaArchive className="inline mr-2" /> {isArchiving ? 'Archiving...' : 'Archive'}
                  </button>
                </>
              )}
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={handleCopyLink}>
                <FaLink className="inline mr-2" /> Copy Link
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-800 whitespace-pre-wrap">
        {compact && post.content.length > 280 ? (
          <>
            {post.content.slice(0, 280)}...{' '}
            <button onClick={() => alert('Open full post')} className="text-blue-600 underline text-xs">
              Expand
            </button>
          </>
        ) : (
          post.content
        )}
      </div>

      {hasLink ? (
        <div className="text-xs text-blue-600 mt-1">
          {post.links.length === 1 ? (
            <span className="cursor-pointer" onClick={() => handleLinkNavigation(post.links[0])}>
              🔗 Linked to {post.links[0].type}: {post.links[0].title || post.links[0].id}
            </span>
          ) : (
            <details>
              <summary className="cursor-pointer">🔗 Linked to {post.links.length} items</summary>
              <ul className="ml-4 list-disc text-blue-700">
                {post.links.map((link, idx) => (
                  <li key={idx} className="cursor-pointer hover:underline" onClick={() => handleLinkNavigation(link)}>
                    {link.type}: {link.title || link.id}
                  </li>
                ))}
                {user && (
                  <li className="text-green-600 hover:underline cursor-pointer" onClick={() => setShowLinkModal(true)}>
                    ➕ Add or change link
                  </li>
                )}
              </ul>
            </details>
          )}
        </div>
      ) : canLink ? (
        <div className="text-xs text-gray-500 mt-1">
          <span className="cursor-pointer text-blue-600" onClick={() => setShowLinkModal(true)}>
            ➕ Add a link to a quest or project
          </span>
        </div>
      ) : null}

      <div className="pt-2">
        <ReactionButton postId={post.id} userId={user?.id} />
      </div>

      {showLinkModal && (
        <LinkToItemModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          post={post}
          onLink={(link) => {
            const updatedPost = { ...post, links: [...(post.links || []), link] };
            onUpdate(updatedPost);
          }}
        />
      )}
    </div>
  );
};

export default PostCard;