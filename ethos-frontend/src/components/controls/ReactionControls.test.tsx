import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ReactionControls from './ReactionControls';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

jest.mock('../../api/post', () => ({
  __esModule: true,
  updateReaction: jest.fn(() => Promise.resolve()),
  addRepost: jest.fn(() => Promise.resolve({ id: 'r1' })),
  removeRepost: jest.fn(() => Promise.resolve()),
  fetchReactions: jest.fn(() => Promise.resolve([])),
  fetchRepostCount: jest.fn(() => Promise.resolve({ count: 0 })),
  fetchUserRepost: jest.fn(() => Promise.resolve(null)),
}));

const navigateMock = jest.fn();

const useBoardContextMock = jest.fn(
  (): { selectedBoard: string | null } => ({ selectedBoard: null })
);

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => useBoardContextMock(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe.skip('ReactionControls', () => {
  const basePost: Post = {
    id: 'p1',
    authorId: 'u1',
    type: 'task',
    content: 'hello',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
    questId: 'q1',
  };
  const user = {
    id: 'u1',
    email: 'u1@example.com',
    username: 'u1',
    password: 'pw',
    role: 'user',
    bio: '',
    tags: [],
    links: {},
    experienceTimeline: [],
  } as User;

  it('shows Quest Log for task posts', async () => {
    render(
      <BrowserRouter>
        <ReactionControls post={basePost} user={user} />
      </BrowserRouter>
    );
    expect(await screen.findByText('Quest Log')).toBeInTheDocument();
  });

  it('defaults to Reply for other post types', async () => {
    const fsPost = { ...basePost, type: 'free_speech' } as Post;
    render(
      <BrowserRouter>
        <ReactionControls post={fsPost} user={user} />
      </BrowserRouter>
    );
    expect(await screen.findByText('Reply')).toBeInTheDocument();
  });

  it('toggles expanded view for tasks', async () => {
    render(
      <BrowserRouter>
        <ReactionControls post={basePost} user={user} />
      </BrowserRouter>
    );
    const expand = await screen.findByText('Expand View');
    fireEvent.click(expand);
    expect(await screen.findByText(/Quest ID/)).toBeInTheDocument();
  });

  it('supports replyOverride prop', () => {
    const handler = jest.fn();
    render(
      <BrowserRouter>
        <ReactionControls
          post={{ ...basePost, type: 'free_speech' } as Post}
          user={user}
          replyOverride={{ label: 'Add Item', onClick: handler }}
        />
      </BrowserRouter>
    );
    const btn = screen.getByText('Add Item');
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalled();
  });

  it('navigates to post page with reply flag when on timeline board', () => {
    useBoardContextMock.mockReturnValue({ selectedBoard: 'timeline-board' });
    const fsPost = { ...basePost, type: 'free_speech' } as Post;
    render(
      <BrowserRouter>
        <ReactionControls post={fsPost} user={user} />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByText('Reply'));
    expect(navigateMock).toHaveBeenCalledWith('/post/p1?reply=1');
  });
});
