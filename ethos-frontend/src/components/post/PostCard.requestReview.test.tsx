import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { requestHelp, removeHelpRequest } from '../../api/post';

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  requestHelp: jest.fn(() =>
    Promise.resolve({
      request: {
        id: 'r1',
        authorId: 'u1',
        type: 'change',
        content: 'Change',
        visibility: 'public',
        timestamp: '',
        tags: ['review'],
        collaborators: [],
        linkedItems: [],
      },
      subRequests: [],
    })
  ),
  removeHelpRequest: jest.fn(() => Promise.resolve({ success: true })),
  updateReaction: jest.fn(() => Promise.resolve()),
  addRepost: jest.fn(() => Promise.resolve({ id: 'r1' })),
  removeRepost: jest.fn(() => Promise.resolve()),
  fetchReactions: jest.fn(() => Promise.resolve([])),
  fetchRepostCount: jest.fn(() => Promise.resolve({ count: 0 })),
  fetchUserRepost: jest.fn(() => Promise.resolve(null)),
}));

const appendMock = jest.fn();
jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ appendToBoard: appendMock, selectedBoard: null }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe('PostCard request review', () => {
  const post: Post = {
    id: 'c1',
    authorId: 'u1',
    type: 'change',
    content: 'Change',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
  } as unknown as Post;

  it('toggles review request', async () => {
    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' } as User} />
      </BrowserRouter>
    );

    const btn = await screen.findByText(/Request Review/i);
    await waitFor(() => expect(btn).not.toBeDisabled());
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() =>
      expect(requestHelp).toHaveBeenCalledWith('c1', 'change')
    );
    expect(appendMock).toHaveBeenNthCalledWith(
      1,
      'quest-board',
      expect.objectContaining({ id: 'r1' })
    );
    expect(appendMock).toHaveBeenNthCalledWith(
      2,
      'timeline-board',
      expect.objectContaining({ id: 'r1' })
    );
    expect(screen.getByText(/In Review/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText(/In Review/i));
    });
    await waitFor(() =>
      expect(removeHelpRequest).toHaveBeenCalledWith('c1', 'change')
    );
  });
});
