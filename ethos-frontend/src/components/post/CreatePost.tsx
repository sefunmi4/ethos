import React, { useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { POST_TYPES, STATUS_OPTIONS, SECONDARY_POST_TYPES } from '../../constants/options';
import { addPost } from '../../api/post';
import { Button, Select, Label, FormSection, Input, MarkdownEditor } from '../ui';
import CollaberatorControls from '../controls/CollaberatorControls';
import LinkControls from '../controls/LinkControls';
import { useBoardContext } from '../../contexts/BoardContext';
import type { BoardType } from '../../types/boardTypes';
import { updateBoard } from '../../api/board';
import type { Post, PostType, LinkedItem, CollaberatorRoles } from '../../types/postTypes';

type CreatePostProps = {
  onSave?: (post: Post) => void;
  onCancel: () => void;
  replyTo?: Post | null;
  repostSource?: Post | null;
  /** Set an initial post type value */
  initialType?: PostType | 'request' | 'review';
  /**
   * Optional quest ID to automatically link the post to.
   * Useful when creating quest tasks or logs from a quest board.
   */
  questId?: string;
  /** Prefill the content field */
  initialContent?: string;
  /**
   * Optional board ID to associate the new post with.
   * When provided this overrides the currently selected board context.
   */
  boardId?: string;
  /**
   * Optional active board view. When provided and the board is a quest board
   * this limits the available post types to those relevant for the view.
   */
};

const CreatePost: React.FC<CreatePostProps> = ({
  onSave,
  onCancel,
  replyTo = null,
  repostSource = null,
  initialType = 'free_speech',
  questId,
  boardId,
  initialContent,
}) => {
  const restrictedReply = !!replyTo;

  const [secondaryType, setSecondaryType] = useState<'' | 'request' | 'review'>(
    initialType === 'request' ? 'request' : initialType === 'review' ? 'review' : ''
  );
  const [type, setType] = useState<PostType>(
    restrictedReply
      ? 'free_speech'
      : initialType === 'request'
      ? 'task'
      : initialType === 'review'
      ? 'change'
      : initialType
  );
  const [status, setStatus] = useState<string>(
    secondaryType === 'request' ? 'In Progress' : 'To Do'
  );
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>(initialContent || '');
  const [details, setDetails] = useState<string>('');
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [collaborators, setCollaborators] = useState<CollaberatorRoles[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpRequest, setHelpRequest] = useState(boardId === 'quest-board' || secondaryType === 'request');
  const [rating, setRating] = useState(0);

const { selectedBoard, appendToBoard, boards } = useBoardContext() || {};

  const boardType: BoardType | undefined =
    boardId ? boards?.[boardId]?.boardType : boards?.[selectedBoard || '']?.boardType;

  let allowedPostTypes: PostType[] = restrictedReply
    ? ['free_speech']
    : boardId === 'quest-board'
    ? ['task', 'change']
    : boardType === 'quest'
    ? ['task', 'free_speech']
    : boardType === 'post'
    ? ['free_speech', 'task', 'change']
    : POST_TYPES.map((p) => p.value as PostType);

  if (secondaryType) {
    allowedPostTypes = ['task', 'change'];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const targetBoard = boardId || selectedBoard;
    const boardQuestMatch = targetBoard?.match(/^(?:log|map)-(.+)$/);
    const questIdFromBoard = boardQuestMatch
      ? boardQuestMatch[1]
      : questId || replyTo?.questId || null;

    if (secondaryType === 'review' && rating === 0) {
      alert('Please provide a rating.');
      setIsSubmitting(false);
      return;
    }

    const autoLinkItems = [...linkedItems];
    if (questIdFromBoard && !autoLinkItems.some((l) => l.itemId === questIdFromBoard)) {
      autoLinkItems.push({ itemId: questIdFromBoard, itemType: 'quest' });
    }

    const validation = validateLinks(type, autoLinkItems, !!replyTo, secondaryType);
    if (!validation.valid) {
      alert(validation.message);
      setIsSubmitting(false);
      return;
    }

      const payload: Partial<Post> = {
        type,
        secondaryType: secondaryType || undefined,
        title: type === 'task' ? content : title || undefined,
        content,
        ...(type === 'task' && details ? { details } : {}),
        visibility: 'public',
        linkedItems: autoLinkItems,
        helpRequest: secondaryType === 'request' || helpRequest || undefined,
        ...(type === 'task' || secondaryType === 'request'
          ? { status }
          : {}),
        ...(questIdFromBoard ? { questId: questIdFromBoard } : {}),
        ...(targetBoard ? { boardId: targetBoard } : {}),
        ...(replyTo ? { replyTo: replyTo.id, parentPostId: replyTo.id, linkType: 'reply' } : {}),
        ...(repostSource
          ? {
              parentPostId: repostSource.id,
              linkType: 'repost',
              repostedFrom: {
                originalPostId: repostSource.id,
                username: repostSource.author?.username,
                originalContent: repostSource.content,
                originalTimestamp: repostSource.timestamp,
              },
            }
          : {}),
        ...(requiresQuestRoles(type) && { collaborators }),
        ...(secondaryType === 'review' && rating ? { rating } : {}),
      };

    try {
      const newPost = await addPost(payload);
      if (targetBoard) {
        appendToBoard(targetBoard, newPost);
        const boardItems = [newPost.id, ...(boards?.[targetBoard]?.items || [])];
        updateBoard(targetBoard, { items: boardItems }).catch((err) =>
          console.error('[CreatePost] Failed to persist board items:', err)
        );
      }
      if (boards?.['my-posts'] && targetBoard !== 'my-posts') {
        appendToBoard('my-posts', newPost);
        const myItems = [newPost.id, ...(boards['my-posts'].items || [])];
        updateBoard('my-posts', { items: myItems }).catch((err) =>
          console.error('[CreatePost] Failed to update my-posts board:', err)
        );
      }

      // Ensure the timeline board reflects new posts immediately
      if (boards?.['timeline-board']) {
        appendToBoard('timeline-board', newPost);
        const timelineItems = [
          newPost.id,
          ...(boards['timeline-board'].items || []),
        ];
        updateBoard('timeline-board', { items: timelineItems }).catch((err) =>
          console.error('[CreatePost] Failed to update timeline board:', err)
        );
      }
      onSave?.(newPost);
    } catch (err) {
      console.error('[CreatePost] Error creating post:', err);
      alert('Failed to create post. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Item Details">
        <Label htmlFor="post-type">Item Type</Label>
        <Select
          id="post-type"
          value={type}
          onChange={(e) => {
            const val = e.target.value as PostType;
            setType(val);
            if (val === 'task') setStatus(secondaryType === 'request' ? 'In Progress' : 'To Do');
            if (val === 'free_speech') setSecondaryType('');
          }}
          options={allowedPostTypes.map((t) => {
            const opt = POST_TYPES.find((o) => o.value === t)!;
            return { value: opt.value, label: opt.label };
          })}
        />

        {type !== 'free_speech' && (
          <>
            <Label htmlFor="secondary-type">Tag</Label>
            <Select
              id="secondary-type"
              value={secondaryType}
              onChange={(e) => {
                const val = e.target.value as '' | 'request' | 'review';
                setSecondaryType(val);
                if (val === 'request') {
                  setStatus('In Progress');
                  setHelpRequest(true);
                } else if (secondaryType === 'request') {
                  setHelpRequest(boardId === 'quest-board');
                }
              }}
              options={[{ value: '', label: 'None' }, ...SECONDARY_POST_TYPES]}
            />
          </>
        )}

        {type === 'task' && (
          <>
            <Label htmlFor="task-status">Status</Label>
            <Select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
            />
          </>
        )}

        {type !== 'task' && (
          <>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={type !== 'free_speech'}
            />
            {secondaryType === 'review' && (
              <div className="mt-2">
                <Label>Rating</Label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const full = rating >= n;
                    const half = !full && rating >= n - 0.5;
                    return (
                      <button
                        type="button"
                        key={n}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const isHalf = e.clientX - rect.left < rect.width / 2;
                          setRating(isHalf ? n - 0.5 : n);
                        }}
                        className="text-xl focus:outline-none text-yellow-400"
                      >
                        {full ? <FaStar /> : half ? <FaStarHalfAlt /> : <FaRegStar />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {type === 'task' ? (
          <>
            <Label htmlFor="content">Task Title</Label>
            <Input
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Short task summary"
              required
            />
            <Label htmlFor="details">Details</Label>
            <MarkdownEditor
              id="details"
              value={details}
              onChange={setDetails}
              placeholder="Additional information (optional)"
            />
          </>
        ) : (
          <>
            <Label htmlFor="content">Description</Label>
            <MarkdownEditor
              id="content"
              value={content}
              onChange={setContent}
              placeholder={
                replyTo
                  ? 'Reply to this post...'
                  : repostSource
                  ? 'Add a comment to your repost...'
                  : 'Share your thoughts or progress...'
              }
            />
          </>
        )}

        {(boardId || selectedBoard) === 'quest-board' && (
          <label className="inline-flex items-center mt-2 space-x-2">
            <input
              type="checkbox"
              checked={helpRequest}
              onChange={(e) => setHelpRequest(e.target.checked)}
              className="form-checkbox"
            />
            <span>Ask for help</span>
          </label>
        )}
      </FormSection>

      {showLinkControls(type) && !replyTo && (
        <FormSection title="Linked Items">
          <LinkControls
            label="Item"
            value={linkedItems}
            onChange={setLinkedItems}
            allowCreateNew
            allowNodeSelection
            itemTypes={['quest', 'post']}
          />
        </FormSection>
      )}

      {requiresQuestRoles(type) && !replyTo && (
        <FormSection title="Collaborators">
          <CollaberatorControls value={collaborators} onChange={setCollaborators} />
        </FormSection>
      )}

      {repostSource && (
        <FormSection title="Repost Info">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Reposting from <strong>@{repostSource.author?.username || 'anonymous'}</strong>
          </p>
        </FormSection>
      )}

      {replyTo && (
        <FormSection title="Replying To">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Replying to <strong>{replyTo.content?.slice(0, 80) || replyTo.id}</strong>
          </p>
        </FormSection>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contrast" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Create Post'}
        </Button>
      </div>
    </form>
  );
};

function requiresQuestRoles(type: PostType): boolean {
  return type === 'task';
}

function showLinkControls(type: PostType): boolean {
  return ['task', 'change'].includes(type);
}

function validateLinks(
  type: PostType,
  items: LinkedItem[],
  hasParent: boolean = false,
  _secondaryType?: string,
): {
  valid: boolean;
  message?: string;
} {
  switch (type) {
    case 'free_speech':
      return items.some(i => i.itemType === 'post')
        ? { valid: false, message: 'Free speech posts cannot have links.' }
        : { valid: true };
    case 'change':
      return hasParent || items.some(i => i.itemType === 'post')
        ? { valid: true }
        : { valid: false, message: 'Please link a task or request before submitting.' };
    default:
      return { valid: true };
  }
}

export default CreatePost;
