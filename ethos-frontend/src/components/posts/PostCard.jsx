import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FaEllipsisH,
  FaLink,
  FaArchive,
  FaTrash,
  FaEdit
} from 'react-icons/fa';
import EditPost from './EditPost';
import { PostTypeBadge } from '../ui';
import { axiosWithAuth } from '../../utils/authUtils';
import { useBoardContext } from '../../contexts/BoardContext';
import ReactionButtons from '../contribution/controls/ReactionButtons';


const PostCard = ({ post, user, onUpdate, onDelete, compact = false }) => {
  const [editMode, setEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [showReplies, setShowReplies] = useState(false);
  const [fetchedReplies, setFetchedReplies] = useState([]);
  const [replies, setReplies] = useState([]);

  const { selectedBoard, removeFromBoard, updateBoardItem } = useBoardContext() || {};

  const canEdit = user?.id === post.authorId || (post.collaborators || []).includes(user?.id);

  const timestamp = post.timestamp
    ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
    : 'Unknown time';

  const toggleReplies = () => {
    setShowReplies((prev) => !prev);
  };

  const repliesToRender = fetchedReplies.length > 0
    ? fetchedReplies
    : post.replies?.filter(p => p.replyTo === post.id) || [];

  useEffect(() => {
    console.log(`[PostCard] repliesToRender for ${post.id}:`, repliesToRender);
  }, [fetchedReplies, post.replies]);

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
      if (selectedBoard?.id) removeFromBoard(selectedBoard.id, post.id);
      updateBoardItem?.(selectedBoard?.id, updatedPost);
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

  const renderLinkSummary = () => {
    if (!post.linkedItems || post.linkedItems.length === 0) return null;

    const grouped = post.linkedItems.reduce((acc, item) => {
      acc[item.type] = acc[item.type] || [];
      acc[item.type].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([type, items]) => (
      <div key={type} className="text-xs text-blue-600">
        <strong>{type}:</strong>{' '}
        {items.map(item => (
          <span key={item.id} className="underline mr-1">{item.title || item.id}</span>
        ))}
      </div>
    ));
  };

  useEffect(() => {
    console.log(`[PostCard] Mounted post: ${post.id}`, post);
  }, [post.id]);

  useEffect(() => {
    const fetchInitialReplies = async () => {
      try {
        const res = await axiosWithAuth.get(`/posts/${post.id}/replies`);
        const data = res.data.replies || [];
        setFetchedReplies(data);
        setReplies(data);
      } catch (err) {
        console.error(`[PostCard] Failed to preload replies for ${post.id}:`, err);
      }
    };
  
    fetchInitialReplies();
  }, [post.id]);

  const renderRepostInfo = () => {
    const repostTrail = [];
    let current = post.repostedFrom;
  
    while (current) {
      repostTrail.push(current);
      current = current.repostedFrom;
    }
  
    const quote = post.repostedFrom;
    const showTrail = repostTrail.length > 0;
    const showQuote = quote?.originalContent;
  
    if (!showTrail && !showQuote) return null;
  
    return (
      <div className="space-y-1">
        {showTrail && (
          <div className="text-xs text-gray-500 italic">
            ♻️ Quote from{' '}
            {repostTrail.map((p, i) => (
              <span key={p.id}>
                @{p.username || p.author?.username || 'unknown'}
                {i < repostTrail.length - 1 && ' → '}
              </span>
            ))}
          </div>
        )}
  
        {showQuote && (
          <blockquote className="border-l-4 border-gray-300 pl-3 my-2 text-gray-500 italic bg-gray-50 rounded">
            “{quote.originalContent.length > 200 ? quote.originalContent.slice(0, 200) + '...' : quote.originalContent}”
            <div className="text-xs mt-1 text-gray-400">
              — @{quote.username || quote.author?.username || 'unknown'}
            </div>
          </blockquote>
        )}
      </div>
    );
  };

  return (
    <div className="relative border rounded bg-white shadow-sm p-4 space-y-2">
      {/* 🧾 Metadata */}
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

      {/* ♻️ Repost Info */}
      {renderRepostInfo()}

      {/* 🧾 Content */}
      <div className="text-sm text-gray-800 whitespace-pre-wrap">
        {compact && post.content.length > 280 ? (
          <>
            {post.content.slice(0, 280)}...{' '}
            <button
              onClick={() => navigate(`/posts/${post.id}`)}
              className="text-blue-600 underline text-xs"
            >
              Expand
            </button>
          </>
        ) : (
          post.content
        )}
      </div>

      {/* 🔗 Link Summary */}
      {post.linkedItems?.length > 0 && (
        <div className="text-xs text-blue-600 mt-1 space-y-1 cursor-pointer">
          {renderLinkSummary()}
        </div>
      )}

      {/* 💬 Reactions */}
      <div className="flex justify-between pt-2">
        <ReactionButtons post={post} user={user} onUpdate={onUpdate} />
        {/* 🧭 Linked Items */}
        {post.linkedItems?.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {(() => {
              const items = post.linkedItems;
              const quests = items.filter(i => i.itemType === 'quest');
              const projects = items.filter(i => i.itemType === 'project');

              const formatItem = (item) =>
                `${item.name || 'Unnamed'}:${item.itemId.slice(0, 4)}${item.nodeId ? `:${item.nodeId.slice(0, 4)}` : ''}`;

              if (items.length === 1) {
                const item = items[0];
                if (item.itemType === 'quest') {
                  return `🔗 Linked to Quest: ${formatItem(item)}`;
                } else if (item.itemType === 'project') {
                  return `🔗 Linked to Project: ${formatItem(item)}`;
                }
              }

              if (quests.length === items.length) {
                return `🔗 Linked to ${quests.length} Quest${quests.length > 1 ? 's' : ''}: ` +
                  quests.map(formatItem).join(', ');
              }

              if (projects.length === items.length) {
                return `🔗 Linked to ${projects.length} Project${projects.length > 1 ? 's' : ''}: ` +
                  projects.map(formatItem).join(', ');
              }

              // Mixed items
              return `🔗 Linked to ${items.length} items: ` + items.map(formatItem).join(', ');
            })()}
          </div>
        )}
      </div>

      {/* 💬 Replies */}
      {replies.length > 0 && (
        <div className="mt-3">
          <button
            onClick={toggleReplies}
            className="text-xs text-blue-600 hover:underline"
          >
            {showReplies ? 'Hide Replies' : `See Replies (${replies.length})`}
          </button>

          {showReplies && replies.length > 0 && (
            <div className="ml-4 mt-3 border-l-2 pl-4 space-y-2 border-blue-200">
              {[...replies]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((reply) => (
                  <PostCard
                    key={reply.id}
                    post={reply}
                    user={user}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    compact
                  />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;