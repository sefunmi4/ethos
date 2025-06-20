import { linkPostToQuest } from './quest';
import { axiosWithAuth } from '../utils/authUtils';

jest.mock('../utils/authUtils', () => ({
  axiosWithAuth: { post: jest.fn(() => Promise.resolve({ data: { success: true } })) }
}));

describe('linkPostToQuest', () => {
  it('POSTs to /quests/:id/link', async () => {
    await linkPostToQuest('q1', { postId: 'p2', parentId: 'p1', edgeType: 'sub_problem', edgeLabel: 'child', title: 'Header' });
    expect(axiosWithAuth.post).toHaveBeenCalledWith('/quests/q1/link', {
      postId: 'p2',
      parentId: 'p1',
      edgeType: 'sub_problem',
      edgeLabel: 'child',
      title: 'Header'
    });
  });
});
