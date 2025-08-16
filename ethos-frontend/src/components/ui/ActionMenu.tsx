import React, { useState, useEffect, useRef } from 'react';
import {
  FaEllipsisH,
  FaEdit,
  FaTrash,
  FaArchive,
  FaLink,
  FaCopy,
  FaUserPlus,
} from 'react-icons/fa';
import { removePost, archivePost } from '../../api/post';
import { removeQuestById, archiveQuestById } from '../../api/quest';
import { removeItemFromBoard } from '../../api/board';

interface ActionMenuProps {
  type: 'post' | 'quest';
  id: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onEditLinks?: () => void;
  onDelete?: () => void;
  onArchived?: () => void;
  permalink?: string;
  content?: string;
  boardId?: string;
  className?: string;
  onJoin?: () => void;
  joinLabel?: string;
  /** Hide the delete option */
  allowDelete?: boolean;
}

/**
 * Reusable ActionMenu for posts/quests
 * - Supports Edit, Archive, Delete, Copy Link
 * - Accepts callbacks for external state update
 */
const ActionMenu: React.FC<ActionMenuProps> = ({
  type,
  id,
  canEdit = false,
  onEdit,
  onDelete,
  onArchived,
  onEditLinks,
  permalink,
  content,
  boardId,
  className = '',
  onJoin,
  joinLabel = 'Request to Join',
  allowDelete = true,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Outside click closes menu
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleArchive = async () => {
    if (!window.confirm('Archive this item?')) return;
    try {
      setIsArchiving(true);
      if (type === 'post') {
        await archivePost(id);
      } else {
        await archiveQuestById(id);
      }
      if (boardId) await removeItemFromBoard(boardId, id);
      onArchived?.();
    } catch (err) {
      console.error(`[ActionMenu] Archive ${type} failed:`, err);
      alert(`Failed to archive ${type}.`);
    } finally {
      setIsArchiving(false);
      setShowMenu(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this ${type} permanently?`)) return;
    try {
      if (type === 'post') {
        await removePost(id);
      } else {
        await removeQuestById(id);
      }
      if (boardId) await removeItemFromBoard(boardId, id);
      onDelete?.();
    } catch (err) {
      console.error(`[ActionMenu] Delete ${type} failed:`, err);
      alert(`Failed to delete ${type}.`);
    } finally {
      setShowMenu(false);
    }
  };

  const handleCopyLink = () => {
    if (!permalink) return;
    navigator.clipboard.writeText(permalink);
    alert('Link copied!');
    setShowMenu(false);
  };

  const handleCopyQuote = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    alert('Quote copied!');
    setShowMenu(false);
  };

  const handleLinkToPost = () => {
    if (!permalink) return;
    navigator.clipboard.writeText(permalink);
    alert(`Link to post ${id} copied!`);
    setShowMenu(false);
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button onClick={() => setShowMenu(!showMenu)} aria-label="More options">
        <FaEllipsisH />
      </button>
      {showMenu && (
        <div className="absolute right-0 mt-1 w-48 z-10 border rounded bg-surface dark:bg-background shadow text-sm">
          {canEdit && (
            <>
              <button onClick={onEdit} className="block w-full text-left px-4 py-2 bg-surface hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">
                <FaEdit className="inline mr-2" /> Edit
              </button>
              {allowDelete && (
                <button
                  onClick={handleDelete}
                  className="block w-full text-left px-4 py-2 bg-surface text-red-600 hover:bg-red-100 dark:hover:bg-gray-700 focus:bg-red-100 dark:focus:bg-gray-700"
                >
                  <FaTrash className="inline mr-2" /> Delete
                </button>
              )}
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="block w-full text-left px-4 py-2 bg-surface hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
              >
                <FaArchive className="inline mr-2" /> {isArchiving ? 'Archiving…' : 'Archive'}
              </button>
              {onEditLinks && (
                <button
                  onClick={() => {
                    onEditLinks();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 bg-surface hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                >
                  <FaLink className="inline mr-2" /> Edit Links
                </button>
              )}
            </>
          )}
          {content && (
            <button
              onClick={handleCopyQuote}
              className="block w-full text-left px-4 py-2 bg-surface hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              <FaCopy className="inline mr-2" /> Copy Quote
            </button>
          )}
          {permalink && type === 'post' && (
            <button
              onClick={handleLinkToPost}
              className="block w-full text-left px-4 py-2 bg-surface hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              <FaLink className="inline mr-2" /> Link to This Post
            </button>
          )}
          {onJoin && (
            <button
              onClick={() => {
                onJoin();
                setShowMenu(false);
              }}
              className="block w-full text-left px-4 py-2 bg-surface hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              <FaUserPlus className="inline mr-2" /> {joinLabel}
            </button>
          )}
          <button onClick={handleCopyLink} className="block w-full text-left px-4 py-2 bg-surface hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">
            <FaLink className="inline mr-2" /> Copy Link
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;