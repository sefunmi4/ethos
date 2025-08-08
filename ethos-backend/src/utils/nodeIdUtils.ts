export type NodeIdParams = {
  quest: { id: string; title: string };
  posts: Array<{ id: string; questId?: string | null; type: string; nodeId?: string; replyTo?: string | null }>;
  postType: string;
  parentPost?: { id: string; nodeId?: string } | null;
};

const slugify = (str: string): string =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
const zeroPad = (num: number): string => num.toString().padStart(2, '0');

const typeMap: Record<string, string> = {
  quest: 'T',
  task: 'T',
  change: 'C',
  free_speech: 'L',
};

export const generateNodeId = ({ quest, posts, postType, parentPost = null }: NodeIdParams): string => {
  const segment = typeMap[postType];
  if (!segment) return '';

  const questSlug = slugify(quest.title);
  const baseQuest = `Q:${questSlug}`;

  if (segment === 'T') {
    const count = posts.filter(p => p.questId === quest.id && p.nodeId && typeMap[p.type] === 'T').length;
    return `${baseQuest}:T${zeroPad(count)}`;
  }

  const basePath = parentPost?.nodeId || baseQuest;
  const prefix = `${basePath}:${segment}`;
  const count = posts.filter(p => p.questId === quest.id && p.nodeId?.startsWith(prefix) && typeMap[p.type] === segment).length;
  return `${prefix}${zeroPad(count)}`;
};
