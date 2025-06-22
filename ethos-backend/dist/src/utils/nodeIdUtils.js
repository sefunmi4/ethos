"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNodeId = void 0;
const slugify = (str) => str
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
const zeroPad = (num) => num.toString().padStart(2, '0');
const typeMap = {
    quest: 'T',
    task: 'T',
    log: 'L',
    commit: 'C',
    issue: 'I',
};
const generateNodeId = ({ quest, posts, postType, parentPost = null }) => {
    const segment = typeMap[postType];
    if (!segment)
        return '';
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
exports.generateNodeId = generateNodeId;
