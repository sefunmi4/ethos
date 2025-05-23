import React, { useState, useEffect, useRef } from 'react';
import RepostModal from '../RepostModal';

const PostFooterMenu = ({ post, onEdit, onDelete, onRepost, onLink }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const menuRef = useRef();

  const toggleMenu = () => setShowMenu((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRepostConfirm = (newPost) => {
    setShowRepostModal(false);
    if (newPost) onRepost?.(newPost);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="text-gray-400 hover:text-gray-700 px-2"
      >
        ⋮
      </button>

      {showMenu && (
        <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded text-sm z-10">
          <li>
            <button
              onClick={() => { setShowMenu(false); onEdit?.(); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              ✏️ Edit
            </button>
          </li>
          <li>
            <button
              onClick={() => { setShowMenu(false); setShowRepostModal(true); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              🔁 Repost / Fork
            </button>
          </li>
          <li>
            <button
              onClick={() => { setShowMenu(false); onLink?.(); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              🔗 Link to Quest / Parent
            </button>
          </li>
          <li>
            <button
              onClick={() => { setShowMenu(false); onDelete?.(); }}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
            >
              🗑️ Delete
            </button>
          </li>
        </ul>
      )}

      {showRepostModal && (
        <RepostModal
          originalPost={post}
          onClose={() => setShowRepostModal(false)}
          onRepost={handleRepostConfirm}
        />
      )}
    </div>
  );
};

export default PostFooterMenu;