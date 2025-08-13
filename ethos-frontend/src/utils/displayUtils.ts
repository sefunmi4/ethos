import type { Post, PostType } from "../types/postTypes";
import type { Quest } from "../types/questTypes";
import { ROUTES } from "../constants/routes";
import type { SummaryTagType } from "../components/ui/SummaryTag";
import { fetchUserById } from "../api/auth";

const usernameCache = new Map<string, string>();

const getUsernameFromId = async (userId: string): Promise<string> => {
  if (usernameCache.has(userId)) return usernameCache.get(userId)!;
  try {
    const user = await fetchUserById(userId);
    const name = user.username || user.id;
    usernameCache.set(userId, name);
    return name;
  } catch {
    usernameCache.set(userId, userId);
    return userId;
  }
};

export const toTitleCase = (str: string): string =>
  str.replace(/\b([a-z])/g, (c) => c.toUpperCase());

export const POST_TYPE_LABELS: Record<PostType | 'request' | 'review', string> = {
  free_speech: "Free Speech",
  task: "Task",
  change: "Change",
  request: "Request",
  review: "Review",
};

/**
 * Builds a unique quest node ID display label for timeline/thread posts.
 * Supports:
 * - Task chain: Q:name:Txx1:Txx2
 * - Log post: Q:name:Lxx
 * - Log reply: Q:name:Tx1:Lx1
 * - Nested reply: Q:name:Tx1:Lx1:Lx2
 * - Forked task: Q:name:Tx1:Tx2
 */
export const getQuestLinkLabel = (
  post: Post,
  questName?: string,
  includeQuestName = false,
): string => {
  let quest = 'Q';
  if (questName !== undefined) {
    quest += ':';
    if (includeQuestName && questName) {
      quest += questName;
    }
  }

  // Strip quest slug from nodeId so labels like `Q::T00:L00` work
  let path = post.nodeId?.trim() || '';
  if (path.startsWith('Q:')) {
    path = path.split(':').slice(2).join(':');
  }

  const suffix = post.id.slice(-4); // used for post-specific log IDs

  const isLog = post.type === 'free_speech' && !!post.replyTo;
  const isTask = post.type === 'task';

  if (isLog) {
    // If nodeId exists use it, otherwise fall back to generated suffix
    return path ? `${quest}:${path}` : `${quest}:L${suffix}`;
  }

  if (isTask && path) {
    return `${quest}:${path}`;
  }

  return `${quest}:${suffix}`;
};

/**
 * Fallback-friendly display title generator.
 * Used when a post isn’t specifically quest-linked.
 */
export const getDisplayTitle = (
  item: Post | Quest,
  questName?: string,
  includeQuestName = false,
  ): string => {
  if ("headPostId" in item) {
    return item.title ?? "";
  }

  const post = item as Post;
  if (post.nodeId || post.questId) {
    return getQuestLinkLabel(post, questName, includeQuestName);
  }

  const content = post.content?.trim() || "";
  const text = content.length > 50 ? content.slice(0, 50) + "…" : content;
  return toTitleCase(text);
};

export interface SummaryTagData {
  type: SummaryTagType;
  label: string;
  link?: string;
  username?: string;
  usernameLink?: string;
  detailLink?: string;
  truncate?: boolean;
}

/**
 * Returns structured summary tags for a post.
 * Each tag contains a label, type, and optional link.
 */
export interface PostWithQuestTitle extends Post {
  questTitle?: string;
}

const formatNodeId = (nodeId: string): string => {
  let path = nodeId.trim();
  if (path.startsWith('Q:')) {
    path = path.split(':').slice(2).join(':');
  }
  const segments = path.split(':');
  const typeSeg = segments.find((s) => s.startsWith('T') || s.startsWith('F') || s.startsWith('L')) || '';
  let typeLabel = '';
  if (typeSeg.startsWith('T')) typeLabel = 'Task';
  else if (typeSeg.startsWith('F')) typeLabel = 'File';
  else if (typeSeg.startsWith('L')) typeLabel = 'Log';
  return typeLabel ? `Q::${typeLabel}:${segments.join(':')}` : `Q:${segments.join(':')}`;
};

export const buildSummaryTags = async (
  post: PostWithQuestTitle,
  questTitle?: string,
  questId?: string,
): Promise<SummaryTagData[]> => {
  void questTitle;
  void questId;
  const tags: SummaryTagData[] = [];

  if (post.type === 'change') {
    if (post.nodeId) {
      const parts = post.nodeId.split(':');
      const changeLabel = formatNodeId(post.nodeId);
      parts.pop();
      const taskNode = parts.join(':');
      if (taskNode) {
        tags.push({
          type: 'task',
          label: formatNodeId(taskNode),
          detailLink: post.replyTo ? ROUTES.POST(post.replyTo) : undefined,
        });
      }
      tags.push({ type: 'change', label: changeLabel, detailLink: ROUTES.POST(post.id) });
    }
    if (post.authorId) {
      const username = await getUsernameFromId(post.authorId);
      tags.push({
        type: 'type',
        label: `@${username}`,
        link: ROUTES.PUBLIC_PROFILE(post.authorId),
      });
    }
    return tags;
  }

  // Primary type tag linking to the post itself
  let primaryType: SummaryTagType = post.type;
  let fallbackLabel = toTitleCase(post.type);
  if (post.type === 'free_speech') {
    primaryType = post.replyTo ? 'log' : 'free_speech';
    fallbackLabel = post.replyTo ? 'Log' : 'Free Speech';
  }

  const nodeLabels: string[] = [];
  if (post.linkedItems && post.linkedItems.length > 0) {
    post.linkedItems.forEach((li) => {
      if (li.nodeId) nodeLabels.push(formatNodeId(li.nodeId));
    });
  } else if (post.nodeId) {
    nodeLabels.push(formatNodeId(post.nodeId));
  }

  const detailLabel = nodeLabels.length > 0 ? nodeLabels.join(', ') : fallbackLabel;

  const primaryTag: SummaryTagData = {
    type: primaryType as SummaryTagType,
    label: detailLabel,
    detailLink: ROUTES.POST(post.id),
  };

  tags.push(primaryTag);

  if (post.authorId) {
    const username = await getUsernameFromId(post.authorId);
    tags.push({
      type: 'type',
      label: `@${username}`,
      link: ROUTES.PUBLIC_PROFILE(post.authorId),
    });
  }

  // Status tag for task posts
  if (post.status && post.type === 'task') {
    tags.push({ type: 'status', label: post.status, detailLink: ROUTES.POST(post.id) });
  }

  // Include non-system tags
  if (post.tags && post.tags.length > 0) {
    const blockedPrefixes = ['summary:', 'pending:'];
    const blockedTags = ['system'];
    post.tags.forEach((rawTag) => {
      const lower = rawTag.toLowerCase();
      if (
        blockedTags.includes(lower) ||
        blockedPrefixes.some((prefix) => lower.startsWith(prefix))
      ) {
        return;
      }

      let tagType: SummaryTagType = 'category';
      let label = rawTag;

      switch (lower) {
        case 'request':
        case 'review':
        case 'change':
        case 'quest':
        case 'task':
        case 'log':
        case 'free_speech':
        case 'party_request':
        case 'quest_task':
        case 'solved':
          tagType = lower as SummaryTagType;
          label = toTitleCase(rawTag);
          break;
        default: {
          if (lower.startsWith('meta:')) {
            const meta = lower.split(':')[1];
            if (meta === 'system') {
              tagType = 'meta_system';
              label = 'System';
            } else if (meta === 'announcement') {
              tagType = 'meta_announcement';
              label = 'Announcement';
            } else {
              label = `#${rawTag}`;
            }
          } else {
            label = `#${rawTag}`;
          }
        }
      }

      tags.push({ type: tagType, label });
    });
  }

  // Remove duplicate entries by label in case of redundant inputs
  return tags.filter((t, idx) => tags.findIndex(o => o.label === t.label && o.type === t.type) === idx);
};

/**
 * Builds a brief summary string for a post.
 * Format: "Quest: {title} Task:{nodeId} {status}".
 * Quest title may be provided via optional param or `post.questTitle` field.
 */
export const getPostSummary = (
  post: PostWithQuestTitle,
  questTitle?: string,
): string => {
  const parts: string[] = [];
  const title = questTitle || post.questTitle;
  const multipleSources = (post.linkedItems || []).length > 1;

  if (post.secondaryType === "review") {
    const user = post.author?.username || post.authorId;
    if (title) parts.push(`(Review: ${title})`);
    parts.push(`(@${user})`);
    if (post.subtype) parts.push(`(${post.subtype})`);
    return parts.join(" ").trim();
  }

  if (title) parts.push(`(Quest: ${title})`);

  if (post.secondaryType === "request") {
    parts.push("(Request)");
    if (post.subtype === "task") {
      if (post.nodeId) parts.push(`(Task - ${getQuestLinkLabel(post, title ?? '', false)})`);
      else parts.push("(Task)");
    } else if (post.subtype === "party") {
      if (post.nodeId)
        parts.push(`(Party - ${getQuestLinkLabel(post, title ?? '', false)})`);
      else parts.push("(Party)");
    }
    return parts.join(" ").trim();
  }

  if (post.type === "free_speech" && post.replyTo) {
    const user = post.author?.username || post.authorId;
    if (post.nodeId && !multipleSources) {
      parts.push(`(Log - ${getQuestLinkLabel(post, title ?? '', false)} @${user})`);
    } else {
      parts.push(`(Log @${user})`);
    }
  } else if (post.type === "task" && post.nodeId) {
    const user = post.author?.username || post.authorId;
    parts.push(`(Task - ${getQuestLinkLabel(post, title ?? '', false)} @${user})`);
  } else if (post.type === "change") {
    const user = post.author?.username || post.authorId;
    if (post.nodeId && !multipleSources) {
      parts.push(`(Change - Q::${post.nodeId.replace(/^Q:[^:]+:/, '')} @${user})`);
    } else {
      parts.push(`(Change @${user})`);
    }
  } else if (post.type) {
    parts.push(`(${post.type.charAt(0).toUpperCase() + post.type.slice(1)})`);
  }

  if (post.status && post.type === "task") {
    parts.push(`(${post.status})`);
  }

  if (post.type === "free_speech") {
    const user = post.author?.username || post.authorId;
    parts.push(`(Free Speech: @${user})`);
  }

  return parts.join(" ").trim();
};
