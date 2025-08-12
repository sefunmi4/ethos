import { enrichPosts } from '../src/utils/enrich';
import type { DBPost } from '../src/types/db';

describe('enrichPosts author fallback', () => {
  it('uses authorId as username when user record is missing', () => {
    const posts: DBPost[] = [{
      id: 'p1',
      authorId: 'guest-123',
      type: 'free_speech',
      content: 'Hello',
      visibility: 'public',
      timestamp: '',
    }];
    const result = enrichPosts(posts, [], []);
    expect(result[0].author).toBeDefined();
    expect(result[0].author?.username).toBe('guest-123');
  });
});
