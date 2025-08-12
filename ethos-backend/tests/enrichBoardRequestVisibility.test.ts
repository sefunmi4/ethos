import { enrichBoard } from '../src/utils/enrich';
import type { DBBoard, DBPost } from '../src/types/db';

describe('enrichBoard request visibility', () => {
  it('keeps request posts with uppercase visibility', () => {
    const board: DBBoard = {
      id: 'quest-board',
      title: 'Quest',
      boardType: 'post',
      layout: 'grid',
      items: ['p1'],
      createdAt: '',
    } as DBBoard;

    const posts: DBPost[] = [
      {
        id: 'p1',
        authorId: 'u1',
        type: 'request',
        content: '',
        visibility: 'PUBLIC' as any,
        timestamp: '',
      },
    ];

    const enriched = enrichBoard(board, { posts, quests: [] });
    expect(enriched.enrichedItems).toHaveLength(1);
    expect(enriched.enrichedItems[0].id).toBe('p1');
  });
});
