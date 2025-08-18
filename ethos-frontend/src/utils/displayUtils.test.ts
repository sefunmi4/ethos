import { getDisplayTitle } from './displayUtils';
import type { Post } from '../types/postTypes';

describe('getDisplayTitle', () => {
  it('returns post title when present', () => {
    const post = {
      id: '1',
      authorId: 'u1',
      type: 'task',
      title: 'My Task',
      content: 'Task content',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
    } as unknown as Post;

    expect(getDisplayTitle(post)).toBe('My Task');
  });
});
