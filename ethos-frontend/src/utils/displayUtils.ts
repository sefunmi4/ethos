import type { Post } from '../types/postTypes';
import { ROUTES } from '../constants/routes';

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

export interface SummaryTagData {
  type:
    | 'quest'
    | 'task'
    | 'issue'
    | 'log'
    | 'review'
    | 'category'
    | 'status'
    | 'free_speech'
    | 'type';
  label: string;
  link?: string;
}

/**
 * Returns structured summary tags for a post.
 * Each tag contains a label, type, and optional link.
 */
export interface PostWithQuestTitle extends Post {
  questTitle?: string;
}

export const buildSummaryTags = (
  post: PostWithQuestTitle,
  questTitle?: string,
  questId?: string
): SummaryTagData[] => {
  const tags: SummaryTagData[] = [];
  const title = questTitle || post.questTitle;
  const multipleSources = (post.linkedItems || []).length > 1;

  if (post.type === 'review') {
    if (!multipleSources && title) {
      tags.push({ type: 'review', label: `Review: ${title}`, link: post.id ? ROUTES.POST(post.id) : undefined });
    }
    if (post.subtype) tags.push({ type: 'category', label: post.subtype });
    return tags;
  }

  if (post.type === 'request') {
    if (post.questId && title) {
      tags.push({
        type: 'request',
        label: `Request: ${title}`,
        link: ROUTES.QUEST(post.questId),
      });
      if (post.nodeId) {
        tags.push({ type: 'task', label: `Task: ${post.nodeId}`, link: ROUTES.POST(post.id) });
      }
      if (post.status && post.status !== 'To Do') {
        tags.push({ type: 'status', label: post.status });
      }
    } else {
      const user = post.author?.username || post.authorId;
      tags.push({ type: 'request', label: `Request: @${user}` });
    }
    return tags;
  }

  if (!multipleSources && title) {
    tags.push({ type: 'quest', label: `Quest: ${title}`, link: (questId || post.questId) ? ROUTES.QUEST(questId || post.questId!) : undefined });
  }

  if (post.type === 'task' && post.nodeId) {
    tags.push({ type: 'task', label: `Task: ${post.nodeId}`, link: ROUTES.POST(post.id) });
  } else if (post.type === 'issue' && post.nodeId) {
    tags.push({ type: 'issue', label: `Issue: ${post.nodeId}`, link: ROUTES.POST(post.id) });
  } else if (post.type === 'log') {
    const user = post.author?.username || post.authorId;
    // Link log tags to the author's public profile for quick context
    tags.push({
      type: 'log',
      label: `Log: @${user}`,
      link: ROUTES.PUBLIC_PROFILE(post.authorId)
    });
  }

  // Include author log reference on task and issue posts for quick context
  if (['task', 'issue'].includes(post.type)) {
    const user = post.author?.username || post.authorId;
    tags.push({
      type: 'log',
      label: `Log: @${user}`,
      link: ROUTES.PUBLIC_PROFILE(post.authorId)
    });
  }

  if (post.status && ['task', 'issue'].includes(post.type)) {
    tags.push({ type: 'status', label: post.status });
  }

  if (post.type === 'free_speech') {
    const user = post.author?.username || post.authorId;
    tags.push({ type: 'free_speech', label: `Free Speech: @${user}` });
  }

  // Remove duplicate entries by label in case of redundant inputs
  return tags.filter((t, idx) =>
    tags.findIndex((o) => o.label === t.label && o.type === t.type) === idx
  );
};

/**
 * Builds a brief summary string for a post.
 * Format: "Quest: {title} Task:{nodeId} {status}".
 * Quest title may be provided via optional param or `post.questTitle` field.
 */
export const getPostSummary = (post: PostWithQuestTitle, questTitle?: string): string => {
  const parts: string[] = [];
  const title = questTitle || post.questTitle;

  if (post.type === 'review') {
    if (title) parts.push(`(Review: ${title})`);
    if (post.subtype) parts.push(`(${post.subtype})`);
    return parts.join(' ').trim();
  }

  if (title) parts.push(`(Quest: ${title})`);

  if (post.type === 'task' && post.nodeId) {
    parts.push(`(Task: ${post.nodeId})`);
  } else if (post.type === 'issue' && post.nodeId) {
    parts.push(`(Issue: ${post.nodeId})`);
  } else if (post.type === 'log') {
    const user = post.author?.username || post.authorId;
    parts.push(`(Log: @${user})`);
  } else if (post.type) {
    parts.push(`(${post.type.charAt(0).toUpperCase() + post.type.slice(1)})`);
  }

  if (post.status && ['task', 'issue'].includes(post.type)) {
    parts.push(`(${post.status})`);
  }

  if (post.type === 'free_speech') {
    const user = post.author?.username || post.authorId;
    parts.push(`(Free Speech: @${user})`);
  }

  return parts.join(' ').trim();
};