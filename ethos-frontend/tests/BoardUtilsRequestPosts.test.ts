import { getRenderableBoardItems } from '../src/utils/boardUtils';
import type { Post } from '../src/types/postTypes';
import type { Quest } from '../src/types/questTypes';

const quest = { id: 'q1', headPostId: 'hp1' } as unknown as Quest;

const requestPost = {
  id: 'p1',
  authorId: 'u1',
  type: 'task',
  content: 'need help',
  visibility: 'public',
  timestamp: '',
  tags: ['request'],
  collaborators: [],
  linkedItems: [],
  questId: 'q1',
} as unknown as Post;

describe('getRenderableBoardItems', () => {
  it('keeps request posts even when linked to a quest', () => {
    const items = getRenderableBoardItems([quest, requestPost]);
    expect(items).toHaveLength(2);
    expect(items.map(i => i.id)).toContain('p1');
  });
});
