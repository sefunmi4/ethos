import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import { fetchRepliesByPostId, updatePost, fetchPostsByQuestId } from '../../api/post';
import { linkPostToQuest } from '../../api/quest';

jest.mock('../../api/post', () => ({
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  updatePost: jest.fn((id, data) => Promise.resolve({ id, ...data })),
  fetchPostsByQuestId: jest.fn(() =>
    Promise.resolve([
      { id: 'p1', authorId: 'u1', type: 'task', content: 'parent', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ])
  )
}));

jest.mock('../../api/quest', () => ({
  linkPostToQuest: jest.fn(() => Promise.resolve({}))
}));

const loadGraphMock = jest.fn();
jest.mock('../../hooks/useGraph', () => ({
  useGraph: () => ({ loadGraph: loadGraphMock })
}));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn(),
}));

describe('PostCard task_edge linking', () => {
  const post: Post = {
    id: 'c1',
    authorId: 'u1',
    type: 'task',
    content: 'child',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [{ itemId: 'q1', itemType: 'quest', linkType: 'task_edge' }]
  } as any;

  it('calls linkPostToQuest and refreshes graph on save', async () => {
    render(<PostCard post={post} questId="q1" user={{ id: 'u1' }} />);
    fireEvent.click(screen.getByLabelText('More options'));
    fireEvent.click(screen.getByText(/Edit Links/i));

    await waitFor(() => expect(fetchPostsByQuestId).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Parent Post'), { target: { value: 'p1' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(linkPostToQuest).toHaveBeenCalled());
    expect(linkPostToQuest).toHaveBeenCalledWith(
      'q1',
      expect.objectContaining({ postId: 'c1', parentId: 'p1', title: expect.any(String) })
    );
    expect(loadGraphMock).toBeCalledWith('q1');
  });
});
