import React, { useState, useEffect, useRef } from 'react';
import {
  FaEllipsisH, FaEdit, FaTrash, FaArchive, FaLink
} from 'react-icons/fa';
import { deletePostById, archivePostById } from '../../api/post';
import { deleteQuestById, archiveQuestById } from '../../api/quest';
import { removeFromBoard } from '../../api/board';

interface ActionMenuProps {
  type: 'post' | 'quest';
  id: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onArchived?: () => void;
  permalink?: string;
  boardId?: string;
  className?: string;
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
  permalink,
  boardId,
  className = '',
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
        await archivePostById(id);
      } else {
        await archiveQuestById(id);
      }
      if (boardId) await removeFromBoard(boardId, id);
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
        await deletePostById(id);
      } else {
        await deleteQuestById(id);
      }
      if (boardId) await removeFromBoard(boardId, id);
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

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button onClick={() => setShowMenu(!showMenu)} aria-label="More options">
        <FaEllipsisH />
      </button>
      {showMenu && (
        <div className="absolute right-0 mt-1 w-48 z-10 border rounded bg-white shadow text-sm">
          {canEdit && (
            <>
              <button onClick={onEdit} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                <FaEdit className="inline mr-2" /> Edit
              </button>
              <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100">
                <FaTrash className="inline mr-2" /> Delete
              </button>
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                <FaArchive className="inline mr-2" /> {isArchiving ? 'Archiving…' : 'Archive'}
              </button>
            </>
          )}
          <button onClick={handleCopyLink} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
            <FaLink className="inline mr-2" /> Copy Link
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;