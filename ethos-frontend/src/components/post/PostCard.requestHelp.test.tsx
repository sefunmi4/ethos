import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import { requestHelp } from '../../api/post';

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
}));

const appendMock = jest.fn();
jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ appendToBoard: appendMock }),
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
  } as any;

  const freeSpeechPost: Post = {
    id: 'fs1',
    authorId: 'u2',
    type: 'free_speech',
    content: 'hello',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
  } as any;

  it('calls endpoint and appends to board', async () => {
    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' }} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/Request Help/i));

    await waitFor(() => expect(requestHelp).toHaveBeenCalledWith('t1'));
    expect(appendMock).toHaveBeenCalled();
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
