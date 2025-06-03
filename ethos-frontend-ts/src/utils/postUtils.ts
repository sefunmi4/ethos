import type { Post } from '../types/postTypes';

/**
 * 🧠 Generates a display-friendly title for any post.
 * If it's a quest-linked post with a nodeId, use `Q_name:nodeId[:postSuffix]`
 * Otherwise, fall back to a content preview.
 */
export const getDisplayTitle = (post: Post): string => {
  if (post.nodeId) {
    const questName = post.questName || 'Q';
    const suffix = post.replyTo ? `:${post.id.slice(-4)}` : '';
    return `${questName}:${post.nodeId}${suffix}`;
  }

  // Fallback for non-quest posts
  const content = post.content?.trim() || '';
  return content.length > 50 ? content.slice(0, 50) + '…' : content;
};