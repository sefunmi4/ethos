import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostPage from '../post/[id]';

const fetchPostById = jest.fn(() => Promise.resolve({
  id: 'p1',
  authorId: 'u1',
  type: 'free_speech',
  content: 'hi',
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: [],
}));
const fetchReplyBoard = jest.fn(() => Promise.resolve({ id: 'thread-p1', items: [], enrichedItems: [] }));

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchPostById: (...args: Parameters<typeof fetchPostById>) => fetchPostById(...args),
  fetchReplyBoard: (...args: Parameters<typeof fetchReplyBoard>) => fetchReplyBoard(...args),
}));

jest.mock('../../components/board/Board', () => ({
  __esModule: true,
  default: () => <div>Board</div>,
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
    useSearchParams: () => [new URLSearchParams('reply=1')],
    useNavigate: () => jest.fn(),
  };
});

describe('PostPage reply flag', () => {
  it('auto opens reply form when reply=1', async () => {
    render(
      <BrowserRouter>
        <PostPage />
      </BrowserRouter>
    );
    await waitFor(() => expect(fetchPostById).toHaveBeenCalled());
    expect(screen.getByText('CreatePost')).toBeInTheDocument();
  });
});
