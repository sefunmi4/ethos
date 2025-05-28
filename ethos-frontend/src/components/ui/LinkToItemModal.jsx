// src/constribution/controls/LinkToItemModal.jsx
import React, { useState } from 'react';
import LinkControls from '../contribution/controls/LinkControls';
import Modal from './Modal';
import { axiosWithAuth } from '../../utils/authUtils';

const LinkToItemModal = ({ isOpen, onClose, post, onLinked }) => {
  const [selectedLink, setSelectedLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!selectedLink?.itemId) {
      setError('Please select an item to link.');
      return;
    }

    setLoading(true);
    try {
      const updatedPost = {
        ...post,
        links: [...(post.links || []), {
          type: 'quest',
          id: selectedLink.itemId,
          nodeId: selectedLink.nodeId || null,
        }],
      };

      await axiosWithAuth.patch(`/posts/${post.id}`, { links: updatedPost.links });

      onLinked(updatedPost);
      onClose();
    } catch (err) {
      console.error('[LinkToItemModal] Failed to update post links:', err);
      setError('Failed to link item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedLink(null);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Link to Quest or Project">
      <div className="space-y-4">
        <LinkControls
          value={selectedLink}
          onChange={(val) => {
            setSelectedLink(val);
            setError('');
          }}
          allowCreateNew={true}
          allowNodeSelection={true}
          label="Item"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Linking...' : 'Link'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkToItemModal;