import { convertFileToFolder, convertFolderToFile } from '../src/utils/taskTypeUtils';
import type { DBPost, DBQuest } from '../src/types/db';

describe('taskTypeUtils', () => {
  test('convertFileToFolder creates child file and rewires edges', () => {
    const post: DBPost = {
      id: 't1',
      authorId: 'u1',
      type: 'task',
      content: 'File',
      visibility: 'public',
      timestamp: '',
      createdAt: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
      questId: 'q1',
      taskType: 'file'
    };
    const child: DBPost = {
      id: 'c1',
      authorId: 'u1',
      type: 'task',
      content: 'child',
      visibility: 'public',
      timestamp: '',
      createdAt: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
      questId: 'q1',
      taskType: 'abstract'
    };
    const posts = [post, child];
    const quest: DBQuest = {
      id: 'q1',
      authorId: 'u1',
      title: 'Q',
      visibility: 'public',
      approvalStatus: 'approved',
      status: 'active',
      headPostId: '',
      linkedPosts: [],
      collaborators: [],
      taskGraph: [{ from: 't1', to: 'c1' }]
    } as any;

    const fileNode = convertFileToFolder(post, posts, quest);
    expect(post.taskType).toBe('folder');
    expect(fileNode.taskType).toBe('file');
    expect(posts).toContain(fileNode);
    expect(quest.taskGraph!.some(e => e.from === fileNode.id && e.to === 'c1')).toBe(true);
    expect(quest.taskGraph!.some(e => e.from === 't1' && e.to === fileNode.id)).toBe(true);
  });

  test('convertFolderToFile merges child file', () => {
    const folder: DBPost = {
      id: 't1',
      authorId: 'u1',
      type: 'task',
      content: '',
      visibility: 'public',
      timestamp: '',
      createdAt: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
      questId: 'q1',
      taskType: 'folder'
    };
    const file: DBPost = {
      id: 'f1',
      authorId: 'u1',
      type: 'task',
      content: '',
      visibility: 'public',
      timestamp: '',
      createdAt: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
      questId: 'q1',
      taskType: 'file'
    };
    const sub: DBPost = {
      id: 'c1',
      authorId: 'u1',
      type: 'task',
      content: '',
      visibility: 'public',
      timestamp: '',
      createdAt: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
      questId: 'q1',
      taskType: 'abstract'
    };
    const posts = [folder, file, sub];
    const quest: DBQuest = {
      id: 'q1',
      authorId: 'u1',
      title: '',
      visibility: 'public',
      approvalStatus: 'approved',
      status: 'active',
      headPostId: '',
      linkedPosts: [],
      collaborators: [],
      taskGraph: [
        { from: 't1', to: 'f1', type: 'folder_split' },
        { from: 'f1', to: 'c1' }
      ]
    } as any;

    convertFolderToFile(folder, posts, quest);
    expect(folder.taskType).toBe('file');
    expect(posts.find(p => p.id === 'f1')).toBeUndefined();
    expect(quest.taskGraph!.some(e => e.from === folder.id && e.to === 'c1')).toBe(true);
    expect(quest.taskGraph!.some(e => e.to === 'f1')).toBe(false);
  });
});
