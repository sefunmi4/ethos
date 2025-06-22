import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import { requestHelp, updatePost } from '../../api/post';

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  requestHelp: jest.fn(() =>
    Promise.resolve({
      id: 'r1',
      authorId: 'u1',
      type: 'request',
      content: 'Task',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
    })
  ),
  updatePost: jest.fn(() => Promise.resolve({})),
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
        <PostCard post={post} user={{ id: 'u1' }} />
      </BrowserRouter>
    );

    const btn = await screen.findByText(/Request Help/i);
    await waitFor(() => expect(btn).not.toBeDisabled());
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => expect(requestHelp).toHaveBeenCalledWith('t1'));
    expect(appendMock).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByText(/Cancel Help/i));
    });
    await waitFor(() => expect(updatePost).toHaveBeenCalledWith('t1', { helpRequest: false, needsHelp: false }));
  });

  it('does not show checkbox for free speech posts', () => {
    render(
      <BrowserRouter>
        <PostCard post={{ ...post, type: 'free_speech' }} />
      </BrowserRouter>
    );

    expect(screen.queryByText(/Request Help/i)).toBeNull();
  });
});
