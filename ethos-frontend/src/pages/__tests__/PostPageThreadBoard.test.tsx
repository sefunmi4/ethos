import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostPage from '../post/[id]';
import type { BoardData } from '../../types/boardTypes';
import type { Post } from '../../types/postTypes';

const fetchPostById = jest.fn(() =>
  Promise.resolve({
    id: 'p1',
    authorId: 'u1',
    type: 'free_speech',
    content: 'hi',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
  })
);

const replyBoard: BoardData = {
  id: 'thread-p1',
  items: ['r1'],
  enrichedItems: [{ id: 'r1' } as unknown as Post],
};
const fetchReplyBoard = jest.fn(() => Promise.resolve(replyBoard));

const boardMock = jest.fn();

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchPostById: (...args: Parameters<typeof fetchPostById>) => fetchPostById(...args),
  fetchReplyBoard: (...args: Parameters<typeof fetchReplyBoard>) => fetchReplyBoard(...args),
}));

jest.mock('../../components/board/Board', () => ({
  __esModule: true,
  default: (props: unknown) => {
    boardMock(props);
    return <div>Board</div>;
  },
}));

jest.mock('../../components/post/PostCard', () => ({
  __esModule: true,
  default: () => <div>PostCard</div>,
}));

jest.mock('../../components/post/CreatePost', () => ({
  __esModule: true,
  default: () => <div>CreatePost</div>,
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

jest.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({ socket: null }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useParams: () => ({ id: 'p1' }),
    useSearchParams: () => [new URLSearchParams('')],
    useNavigate: () => jest.fn(),
  };
});

describe('PostPage thread board', () => {
  it('does not include main post in thread board items', async () => {
    render(
      <BrowserRouter>
        <PostPage />
      </BrowserRouter>
    );
    await waitFor(() => expect(boardMock).toHaveBeenCalled());
    const props = boardMock.mock.calls[0][0];
    expect(props.board.items).not.toContain('p1');
    expect(props.board.title).toBe('Thread');
  });
});
