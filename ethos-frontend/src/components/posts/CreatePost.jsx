import React, { useState } from 'react';
import { POST_TYPES } from '../../constants/POST_TYPES';
import { Button, TextArea, Select, Label, FormSection } from '../ui';
import RoleAssignment from '../contribution/controls/RoleAssignment';
import LinkControls from '../contribution/controls/LinkControls';
import { axiosWithAuth } from '../../utils/authUtils';
import { useBoardContext } from '../../contexts/BoardContext';

const CreatePost = ({ onSave, onCancel, replyTo = null, repostSource = null }) => {
  const [type, setType] = useState('free_speech');
  const [content, setContent] = useState('');
  const [linkedQuestNode, setLinkedQuestNode] = useState(null); // { questId, nodeId }
  const [linkedItems, setLinkedItems] = useState([]);
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selectedBoard, appendToBoard } = useBoardContext() || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
  
    const isQuestLinked = linkedQuestNode?.questId;
  
    if ((type === 'quest_log' || type === 'quest_task') && !isQuestLinked) {
      alert('Please link a quest.');
      setIsSubmitting(false);
      return;
    }
  
    const payload = {
      type,
      content,
      visibility: 'public',
      boardId: selectedBoard?.id || null,
      questId: isQuestLinked ? linkedQuestNode.questId : null,
      nodeId: linkedQuestNode?.nodeId || null,
      assignedRoles: type === 'quest_task' ? assignedRoles : [],
      linkedItems: linkedItems.length > 0 ? linkedItems : [],
      replyTo: replyTo?.id || null, // ✅ Always include replyTo, even if null
      ...(replyTo && {
        parentPostId: replyTo.id,
        linkType: 'reply',
      }),
      ...(repostSource && {
        parentPostId: repostSource.id,
        linkType: 'repost',
        repostedFrom: {
          id: repostSource.author?.id,
          username: repostSource.author?.username,
          originalPostId: repostSource.id,
        },
      }),
    };
  
    try {
      const res = await axiosWithAuth.post('/posts', payload);
      if (res.status === 201) {
        const newPost = res.data;
        if (selectedBoard?.id) appendToBoard(selectedBoard.id, newPost);
        onSave?.(newPost);
      } else {
        console.error('[CreatePost] Unexpected status:', res.status);
        alert('Unexpected error occurred. Please try again.');
      }
    } catch (err) {
      console.error('[CreatePost] Failed to create post:', err);
      alert('Failed to create post. Check your input or try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Post Details">
        {!replyTo && !repostSource && (
          <>
            <Label htmlFor="post-type">Post Type</Label>
            <Select
              id="post-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={POST_TYPES.map(({ value, label }) => ({ value, label }))}
            />
          </>
        )}

        <Label htmlFor="content">Content</Label>
        <TextArea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyTo ? 'Reply to this post...' : repostSource ? 'Add a comment to your repost...' : 'Share your thoughts or progress...'}
          required
        />
      </FormSection>

      {(type === 'quest_log' || type === 'quest_task') && (
        <FormSection title="Linked Quest">
          <LinkControls
            label="Quest"
            value={linkedQuestNode}
            onChange={(items) => {
              const questItem = items.find((v) => v.itemType === 'quest');
              if (questItem) {
                setLinkedQuestNode({ questId: questItem.itemId, nodeId: questItem.nodeId || null });
                setLinkedItems([questItem]);
              } else {
                setLinkedQuestNode(null);
                setLinkedItems([]);
              }
            }}
            allowCreateNew
            allowNodeSelection
          />
        </FormSection>
      )}

      {type === 'quest_task' && (
        <FormSection title="Assigned Roles">
          <RoleAssignment value={assignedRoles} onChange={setAssignedRoles} />
        </FormSection>
      )}

      {repostSource && (
        <FormSection title="Repost Info">
          <p className="text-xs text-gray-600">
            Reposting from <strong>@{repostSource?.author?.username || 'anonymous'}</strong>
          </p>
        </FormSection>
      )}

      {replyTo && (
        <FormSection title="Replying To">
          <p className="text-xs text-gray-600">
            Replying to post <strong>{replyTo.content?.slice(0, 80) || replyTo.id}</strong>
          </p>
        </FormSection>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Create Post'}
        </Button>
      </div>
    </form>
  );
};

export default CreatePost;