import React, { useState } from 'react';
import PostEditor from '../posts/PostEditor';
import { useBoard } from '../../contexts/BoardContext';

const BoardAddItem = ({ boardId: propBoardId, onCreate = () => {} }) => {
  const context = useBoard?.();
  const board = context?.board || {};
  const boardId = propBoardId || board?.id || null;

  const [isCreating, setIsCreating] = useState(false);
  const [postData, setPostData] = useState({ type: 'free_speech' });
  const [quests, setQuests] = useState(context?.quests || []);

  const handleSave = (newPost) => {
    const postWithContext = {
      ...newPost,
      boardId,
      parentIds: boardId ? [boardId] : [],
      structure: board?.structure === 'chat' ? 'thread' : undefined,
    };

    onCreate(postWithContext);
    resetForm();
  };

  const handleNewQuest = (newQuest) => {
    setQuests((prev) => [...prev, newQuest]);
  };

  const resetForm = () => {
    setIsCreating(false);
    setPostData({ type: 'free_speech' });
  };

  return (
    <div className="mb-4">
      {isCreating ? (
        <div className="border rounded p-4 bg-white shadow-sm">
          <PostEditor
            post={postData}
            quests={quests}
            onSave={handleSave}
            onCancel={resetForm}
            onNewQuest={handleNewQuest}
          />
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="text-sm text-indigo-600 hover:underline"
        >
          + Add item
        </button>
      )}
    </div>
  );
};

export default BoardAddItem;