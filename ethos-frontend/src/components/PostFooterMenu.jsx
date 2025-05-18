import React from 'react';

const PostFooterMenu = ({
  showMenu,
  setShowMenu,
  menuRef,
  onEdit,
  onDelete,
  onShare,
  isOwner,
  isCollaborator,
}) => {
  const canEdit = isOwner || isCollaborator;

  return (
    <div className="relative">
      <div
        ref={menuRef}
        className="bottom-2 right-2"
        onMouseEnter={() => clearTimeout(window._menuTimeout)}
        onMouseLeave={() => {
          window._menuTimeout = setTimeout(() => setShowMenu(false), 200);
        }}
      >
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-500 hover:text-black text-xl focus:outline-none"
          aria-label="Post options"
        >
          &#x22EE;
        </button>

        {showMenu && (
          <ul className="absolute right-0 bottom-8 w-32 bg-white border rounded shadow text-sm z-20">
            {canEdit && (
              <>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={onEdit}
                >
                  Edit
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                  onClick={onDelete}
                >
                  Remove
                </li>
              </>
            )}
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={onShare}
            >
              Share
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default PostFooterMenu;