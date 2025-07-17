import type { Post, PostType } from "../types/postTypes";
import { ROUTES } from "../constants/routes";

export const toTitleCase = (str: string): string =>
  str.replace(/\b([a-z])/g, (c) => c.toUpperCase());

export const POST_TYPE_LABELS: Record<PostType, string> = {
  free_speech: "Free Speech",
  request: "Request",
  log: "Log",
  quest_log: "Log",
  task: "Task",
  quest: "Quest",
  meta_system: "System",
  meta_announcement: "Announcement",
  commit: "Commit",
  issue: "Issue",
  review: "Review",
  solved: "Solved",
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

  const isLog = post.type === 'log' || post.type === 'quest_log';
  const isTask = post.type === 'task' || post.type === 'issue';

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
  post: Post,
  questName?: string,
  includeQuestName = false,
): string => {
  if (post.nodeId || post.questId) {
    return getQuestLinkLabel(post, questName, includeQuestName);
  }

  const content = post.content?.trim() || "";
  const text = content.length > 50 ? content.slice(0, 50) + "…" : content;
  return toTitleCase(text);
};

export interface SummaryTagData {
  type:
    | "quest"
    | "task"
    | "issue"
    | "log"
    | "review"
    | "category"
    | "status"
    | "free_speech"
    | "type"
    | "commit"
    | "quest_task"
    | "meta_system"
    | "meta_announcement"
    | "solved"
    | "request"
    | "party_request";
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

export const buildSummaryTags = (
  post: PostWithQuestTitle,
  questTitle?: string,
  questId?: string,
): SummaryTagData[] => {
  const tags: SummaryTagData[] = [];
  const title = questTitle || post.questTitle;
  const multipleSources = (post.linkedItems || []).length > 1;

  if (post.type === "review") {
    const user = post.author?.username || post.authorId;
    tags.push({
      type: "review",
      label: title ? `Review: ${title}` : "Review",
      detailLink: post.id ? ROUTES.POST(post.id) : undefined,
      username: user,
      usernameLink: ROUTES.PUBLIC_PROFILE(post.authorId),
    });
    if (post.subtype) {
      tags.push({
        type: "category",
        label: post.subtype,
        detailLink: ROUTES.POST(post.id),
      });
    }
    return tags;
  }

  if (post.type === "request") {
    let label = "Request";
    if (post.questId && title) {
      if (post.subtype === "task") {
        const id = post.nodeId
          ? getQuestLinkLabel(post, "", false)
          : undefined;
        label = id ? `Task Request - ${id}` : "Task Request";
      } else if (post.subtype === "issue") {
        const id = post.nodeId
          ? getQuestLinkLabel(post, "", false)
          : undefined;
        label = id ? `Issue Request - ${id}` : "Issue Request";
      } else if (post.subtype === "party") {
        const id = post.nodeId
          ? getQuestLinkLabel(post, "", false)
          : undefined;
        label = id ? `Party Request - ${id}` : "Party Request";
        const user = post.author?.username || post.authorId;
        tags.push({
          type: "party_request",
          label,
          detailLink: ROUTES.POST(post.id),
          username: user,
          usernameLink: ROUTES.PUBLIC_PROFILE(post.authorId),
        });
        if (post.status && post.status !== "To Do") {
          tags.push({
            type: "status",
            label: post.status,
            detailLink: ROUTES.POST(post.id),
          });
        }
        return tags;
      } else {
        label = "Request - Quest";
      }
      tags.push({ type: "request", label, detailLink: ROUTES.POST(post.id) });
    } else {
      const user = post.author?.username || post.authorId;
      tags.push({
        type: "request",
        label,
        detailLink: ROUTES.POST(post.id),
        username: user,
        usernameLink: ROUTES.PUBLIC_PROFILE(post.authorId),
      });
    }
    if (post.status && post.status !== "To Do") {
      tags.push({
        type: "status",
        label: post.status,
        detailLink: ROUTES.POST(post.id),
      });
    }
    return tags;
  }

  if (!multipleSources && title) {
    tags.push({
      type: "quest",
      label: `Quest: ${title}`,
      link:
        questId || post.questId
          ? ROUTES.QUEST(questId || post.questId!)
          : undefined,
    });
  }

  if (post.type === "task" && post.nodeId) {
    const label = post.nodeId.replace(/^Q:[^:]+:/, "");
    tags.push({
      type: "task",
      label,
      detailLink: ROUTES.POST(post.id),
    });
  } else if (post.type === "issue") {
    const label =
      post.nodeId && !multipleSources
        ? post.nodeId.replace(/^Q:[^:]+:/, "")
        : "Issue";
    tags.push({
      type: "issue",
      label,
      detailLink: ROUTES.POST(post.id),
    });
  } else if (post.type === "log" || post.type === "quest_log") {
    const user = post.author?.username || post.authorId;
    const label =
      post.nodeId && !multipleSources
        ? `Log - ${getQuestLinkLabel(post, title ?? '', false)}`
        : "Log";
    tags.push({
      type: "log",
      label,
      detailLink: ROUTES.POST(post.id),
      username: user,
      usernameLink: ROUTES.PUBLIC_PROFILE(post.authorId),
    });
  } else if (post.type === "commit") {
    const user = post.author?.username || post.authorId;
    const label =
      post.nodeId && !multipleSources
        ? `Commit - Q::${post.nodeId.replace(/^Q:[^:]+:/, '')}`
        : "Commit";
    tags.push({
      type: "commit",
      label,
      detailLink: ROUTES.POST(post.id),
      username: user,
      usernameLink: ROUTES.PUBLIC_PROFILE(post.authorId),
    });
  } else if (post.type === "meta_system") {
    tags.push({
      type: "meta_system",
      label: "System",
      detailLink: ROUTES.POST(post.id),
    });
  } else if (post.type === "meta_announcement") {
    tags.push({
      type: "meta_announcement",
      label: "Announcement",
      detailLink: ROUTES.POST(post.id),
    });
  } else if (post.type === "solved") {
    tags.push({
      type: "solved",
      label: "Solved",
      detailLink: ROUTES.POST(post.id),
    });
  }

  if (post.status && ["task", "issue"].includes(post.type)) {
    tags.push({
      type: "status",
      label: post.status,
      detailLink: ROUTES.POST(post.id),
    });
  }

  if (post.type === "free_speech") {
    const user = post.author?.username || post.authorId;
    tags.push({
      type: "free_speech",
      label: `Free Speech: @${user}`,
      link: ROUTES.PUBLIC_PROFILE(post.authorId),
    });
  }

  // Remove duplicate entries by label in case of redundant inputs
  return tags.filter(
    (t, idx) =>
      tags.findIndex((o) => o.label === t.label && o.type === t.type) === idx,
  );
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

  if (post.type === "review") {
    const user = post.author?.username || post.authorId;
    if (title) parts.push(`(Review: ${title})`);
    parts.push(`(@${user})`);
    if (post.subtype) parts.push(`(${post.subtype})`);
    return parts.join(" ").trim();
  }

  if (title) parts.push(`(Quest: ${title})`);

  if (post.type === "request") {
    parts.push("(Request)");
    if (post.subtype === "task") {
      if (post.nodeId) parts.push(`(Task - ${getQuestLinkLabel(post, title ?? '', false)})`);
      else parts.push("(Task)");
    } else if (post.subtype === "issue") {
      if (post.nodeId)
        parts.push(
          `(Issue - ${getQuestLinkLabel(post, title ?? '', false)})`
        );
      else parts.push("(Issue)");
    } else if (post.subtype === "party") {
      if (post.nodeId)
        parts.push(`(Party - ${getQuestLinkLabel(post, title ?? '', false)})`);
      else parts.push("(Party)");
    }
    return parts.join(" ").trim();
  }

  if (post.type === "task" && post.nodeId) {
    const user = post.author?.username || post.authorId;
    parts.push(`(Task - ${getQuestLinkLabel(post, title ?? '', false)} @${user})`);
  } else if (post.type === "issue") {
    const user = post.author?.username || post.authorId;
    if (post.nodeId && !multipleSources) {
        parts.push(`(Issue - ${getQuestLinkLabel(post, title ?? '', false)} @${user})`);
    } else {
      parts.push(`(Issue @${user})`);
    }
  } else if (post.type === "log" || post.type === "quest_log") {
    const user = post.author?.username || post.authorId;
    if (post.nodeId && !multipleSources) {
        parts.push(`(Log - ${getQuestLinkLabel(post, title ?? '', false)} @${user})`);
    } else {
      parts.push(`(Log @${user})`);
    }
  } else if (post.type === "commit") {
    const user = post.author?.username || post.authorId;
    if (post.nodeId && !multipleSources) {
      parts.push(`(Commit - Q::${post.nodeId.replace(/^Q:[^:]+:/, '')} @${user})`);
    } else {
      parts.push(`(Commit @${user})`);
    }
  } else if (post.type === "meta_system") {
    parts.push("(System)");
  } else if (post.type === "meta_announcement") {
    parts.push("(Announcement)");
  } else if (post.type === "solved") {
    parts.push("(Solved)");
  } else if (post.type) {
    parts.push(`(${post.type.charAt(0).toUpperCase() + post.type.slice(1)})`);
  }

  if (post.status && ["task", "issue"].includes(post.type)) {
    parts.push(`(${post.status})`);
  }

  if (post.type === "free_speech") {
    const user = post.author?.username || post.authorId;
    parts.push(`(Free Speech: @${user})`);
  }

  return parts.join(" ").trim();
};
