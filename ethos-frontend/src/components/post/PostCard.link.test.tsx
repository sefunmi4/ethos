import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import { fetchPostsByQuestId } from '../../api/post';
import { linkPostToQuest } from '../../api/quest';

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  updatePost: jest.fn((id, data) => Promise.resolve({ id, ...data })),
  fetchPostsByQuestId: jest.fn(() =>
    Promise.resolve([
      { id: 'p1', authorId: 'u1', type: 'task', content: 'parent', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ])
  )
}));

jest.mock('../../api/quest', () => ({
  __esModule: true,
  linkPostToQuest: jest.fn(() => Promise.resolve({}))
}));

jest.mock('../../contexts/BoardContext', () => ({
  useBoardContext: () => ({ selectedBoard: 'b1', updateBoardItem: jest.fn() }),
}));

const loadGraphMock = jest.fn();
jest.mock('../../hooks/useGraph', () => ({
  useGraph: () => ({ loadGraph: loadGraphMock })
}));

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ selectedBoard: 'b1', updateBoardItem: jest.fn(), appendToBoard: jest.fn() })
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe.skip('PostCard task_edge linking', () => {
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
  } as unknown as Post;

  it('calls linkPostToQuest and refreshes graph on save', async () => {
    render(
      <BrowserRouter>
        <PostCard post={post} questId="q1" user={{ id: 'u1' }} />
      </BrowserRouter>
    );
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
