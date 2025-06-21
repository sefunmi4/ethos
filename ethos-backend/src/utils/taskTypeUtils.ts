import { v4 as uuidv4 } from 'uuid';
import type { DBPost, DBQuest, TaskEdge } from '../types/db';

/**
 * Convert a file-type task into a folder.
 * Creates a new file child and reassigns existing children under it.
 */
export function convertFileToFolder(post: DBPost, posts: DBPost[], quest: DBQuest): DBPost {
  if (post.taskType !== 'file') return post;
  post.taskType = 'folder';

  const newFile: DBPost = {
    ...post,
    id: uuidv4(),
    taskType: 'file',
    timestamp: new Date().toISOString(),
    replyTo: null,
    repostedFrom: null,
    nodeId: undefined,
    linkedNodeId: undefined,
  };
  posts.push(newFile);

  quest.taskGraph = quest.taskGraph || [];
  quest.taskGraph
    .filter(e => e.from === post.id)
    .forEach(e => (e.from = newFile.id));
  quest.taskGraph.push({ from: post.id, to: newFile.id, type: 'folder_split' });

  return newFile;
}

/**
 * Convert a folder-type task back into a file.
 * Removes the child file node and promotes its children.
 */
export function convertFolderToFile(post: DBPost, posts: DBPost[], quest: DBQuest): void {
  if (post.taskType !== 'folder') return;

  const edges = quest.taskGraph || [];
  const fileEdge = edges.find(e => e.from === post.id && posts.find(p => p.id === e.to)?.taskType === 'file');
  if (fileEdge) {
    const filePost = posts.find(p => p.id === fileEdge.to);
    if (filePost) {
      edges.filter(e => e.from === filePost.id).forEach(e => (e.from = post.id));
      const idx = posts.findIndex(p => p.id === filePost.id);
      if (idx >= 0) posts.splice(idx, 1);
    }
    quest.taskGraph = edges.filter(e => e !== fileEdge);
  }
  post.taskType = 'file';
}
