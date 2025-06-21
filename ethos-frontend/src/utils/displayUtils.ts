import type { Post } from '../types/postTypes';

/**
 * Builds a unique quest node ID display label for timeline/thread posts.
 * Supports:
 * - Task chain: Q:name:Txx1:Txx2
 * - Log post: Q:name:Lxx
 * - Log reply: Q:name:Tx1:Lx1
 * - Nested reply: Q:name:Tx1:Lx1:Lx2
 * - Forked task: Q:name:Tx1:Tx2
 */
export const getQuestLinkLabel = (post: Post): string => {
  const quest = 'Q';
  const node = post.nodeId?.trim();
  const suffix = post.id.slice(-4); // used for post-specific log IDs

  const isLog = post.type === 'log';
  const isTask = post.type === 'task';
  const isReply = !!post.replyTo;

  // 📌 Log post in timeline view
  if (isLog && !post.replyTo && !node) {
    return `${quest}:L${suffix}`;
  }

  // 📌 Log reply in timeline view
  if (isLog && isReply && node) {
    return `${quest}:${node}:L${suffix}`;
  }

  // 📌 Nested log reply (log inside log, or deeper)
  if (isLog && isReply && node?.startsWith('Tx')) {
    return `${quest}:${node}:L${suffix}`;
  }

  // 📌 Generic task with ancestry or chain
  if (isTask && node) {
    return `${quest}:${node}`;
  }

  // 📌 Fallback for anything else
  return `${quest}:${suffix}`;
};

/**
 * Fallback-friendly display title generator.
 * Used when a post isn’t specifically quest-linked.
 */
export const getDisplayTitle = (post: Post): string => {
  if (post.nodeId || post.questId) {
    return getQuestLinkLabel(post);
  }

  const content = post.content?.trim() || '';
  return content.length > 50 ? content.slice(0, 50) + '…' : content;
};

/**
 * Builds a brief summary string for a post.
 * Format: "Quest: {title} Task:{nodeId} {status}".
 * Quest title may be provided via optional param or `post.questTitle` field.
 */
export const getPostSummary = (post: Post, questTitle?: string): string => {
  const parts: string[] = [];
  const title = questTitle || (post as any).questTitle;
  if (title) parts.push(`Quest: ${title}`);

  if (post.nodeId) {
    parts.push(`Task:${post.nodeId}`);
  } else if (post.type) {
    parts.push(post.type.charAt(0).toUpperCase() + post.type.slice(1));
  }

  if (post.status) parts.push(post.status);

  return parts.join(' ').trim();
};