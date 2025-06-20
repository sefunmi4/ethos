import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import { requestHelpForTask } from '../../api/post';

jest.mock('../../api/post', () => ({
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  requestHelpForTask: jest.fn(() =>
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
  useBoardContext: () => ({ appendToBoard: appendMock }),
}));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn(),
}));

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

  it('calls endpoint and appends to board', async () => {
    render(<PostCard post={post} user={{ id: 'u1' }} />);

    fireEvent.click(screen.getByText(/Request Help/i));

    await waitFor(() => expect(requestHelpForTask).toHaveBeenCalledWith('t1'));
    expect(appendMock).toHaveBeenCalled();
  });
});
