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
        type: 'task',
        content: 'Task',
        visibility: 'public',
        timestamp: '',
        tags: ['request'],
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
const removeMock = jest.fn();
jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({
    appendToBoard: appendMock,
    removeItemFromBoard: removeMock,
    selectedBoard: null,
  }),
}));

jest.mock('../layout/MapGraphLayout', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe('PostCard request help', () => {
  const post: Post = {
    id: 't1',
    authorId: 'u1',
    type: 'task',
    content: 'Task',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
  } as unknown as Post;


  it('calls endpoint and appends to board', async () => {
    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' } as User} />
      </BrowserRouter>
    );

    const btn = await screen.findByLabelText(/Request Help/i);
    await waitFor(() => expect(btn).not.toBeDisabled());
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() =>
      expect(requestHelp).toHaveBeenCalledWith('t1', 'task')
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

    await act(async () => {
      fireEvent.click(screen.getByText(/Requested/i));
    });
    await waitFor(() =>
      expect(removeHelpRequest).toHaveBeenCalledWith('t1')
    );
    expect(removeMock).toHaveBeenNthCalledWith(1, 'quest-board', 'r1');
    expect(removeMock).toHaveBeenNthCalledWith(2, 'timeline-board', 'r1');
  });

  it('does not show checkbox for free speech posts', () => {
    render(
      <BrowserRouter>
        <PostCard post={{ ...post, type: 'free_speech' }} />
      </BrowserRouter>
    );

    expect(screen.queryByText(/Request Help/i)).toBeNull();
  });

  it('keeps requested state after rerender', async () => {
    const { rerender } = render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' } as User} />
      </BrowserRouter>
    );

    const btn = await screen.findByLabelText(/Request Help/i);
    await act(async () => {
      fireEvent.click(btn);
    });
    await screen.findByText(/Requested/i);

    rerender(
      <BrowserRouter>
        <PostCard post={{ ...post, helpRequest: true }} user={{ id: 'u1' } as User} />
      </BrowserRouter>
    );
    expect(screen.getByText(/Requested/i)).toBeInTheDocument();
  });
});
