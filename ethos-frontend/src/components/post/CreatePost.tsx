import React, { useState } from 'react';
import { POST_TYPES, STATUS_OPTIONS, SECONDARY_POST_TYPES } from '../../constants/options';
import { addPost } from '../../api/post';
import { Button, Select, Label, FormSection, Input, MarkdownEditor } from '../ui';
import CollaberatorControls from '../controls/CollaberatorControls';
import { useBoardContext } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
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
  const replyToType = replyTo?.type;
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isParticipant = replyTo
    ? replyTo.authorId === currentUserId ||
      (replyTo.collaborators || []).some((c) => c.userId === currentUserId) ||
      (currentUserId
        ? !!(
            replyTo.reactions?.request?.[currentUserId] ||
            replyTo.reactions?.review?.[currentUserId]
          )
        : false)
    : false;

  const [type, setType] = useState<PostType | 'review'>(
    restrictedReply
      ? 'free_speech'
      : initialType === 'request'
      ? 'task'
      : initialType === 'review'
      ? 'review'
      : initialType
  );
  const [status, setStatus] = useState<string>('To Do');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>(initialContent || '');
  const [details, setDetails] = useState<string>('');
  const [collaborators, setCollaborators] = useState<CollaberatorRoles[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  

const { selectedBoard, appendToBoard, boards } = useBoardContext() || {};

  const boardType: BoardType | undefined =
    boardId ? boards?.[boardId]?.boardType : boards?.[selectedBoard || '']?.boardType;

  const allowedPostTypes: (PostType | 'review')[] = restrictedReply
    ? replyToType === 'task'
      ? isParticipant
        ? ['free_speech', 'task', 'file']
        : ['free_speech']
      : replyToType === 'file'
      ? ['free_speech', 'review']
      : ['free_speech']
    : boardId === 'timeline-board'
    ? ['free_speech', 'task']
    : boardId === 'quest-board'
    ? ['task', 'file']
    : boardType === 'quest'
    ? ['task', 'free_speech']
    : boardType === 'post'
    ? ['free_speech', 'task', 'file']
    : POST_TYPES.map((p) => p.value as PostType);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const targetBoard = boardId || selectedBoard;
    const boardQuestMatch = targetBoard?.match(/^(?:log|map)-(.+)$/);
    const questIdFromBoard = boardQuestMatch
      ? boardQuestMatch[1]
      : questId || replyTo?.questId || null;

    const autoLinkItems: LinkedItem[] = [];
    if (questIdFromBoard) {
      autoLinkItems.push({ itemId: questIdFromBoard, itemType: 'quest' });
    }

    const payload: Partial<Post> = {
      type: type === 'review' ? 'file' : type,
      title: type === 'task' ? content : title || undefined,
      content,
      ...(type === 'task' && details ? { details } : {}),
      visibility: 'public',
      linkedItems: autoLinkItems,
      ...(type === 'task' ? { status } : {}),
      ...(type === 'review' ? { tags: ['review'] } : {}),
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
            const val = e.target.value as PostType | 'review';
            setType(val);
            if (val === 'task') setStatus('To Do');
          }}
          options={allowedPostTypes.map((t) => {
            if (t === 'review') {
              const opt = SECONDARY_POST_TYPES.find(o => o.value === 'review')!;
              return { value: opt.value, label: opt.label };
            }
            const opt = POST_TYPES.find((o) => o.value === t)!;
            return { value: opt.value, label: opt.label };
          })}
        />

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

      </FormSection>

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

function requiresQuestRoles(type: PostType | 'review'): boolean {
  return type === 'task';
}

export default CreatePost;
