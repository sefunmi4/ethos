import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReactionControls from './ReactionControls';
import type { Post } from '../../types/postTypes';

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

const useBoardContextMock = jest.fn(() => ({ selectedBoard: null }));

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

describe('ReactionControls', () => {
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
  } as any;

  it('shows Quest Log for task posts', async () => {
    render(
      <BrowserRouter>
        <ReactionControls post={basePost} user={{ id: 'u1' }} />
      </BrowserRouter>
    );
    expect(await screen.findByText('Quest Log')).toBeInTheDocument();
  });

  it('shows File Change View for commit posts', async () => {
    const commitPost = { ...basePost, type: 'commit' } as Post;
    render(
      <BrowserRouter>
        <ReactionControls post={commitPost} user={{ id: 'u1' }} />
      </BrowserRouter>
    );
    expect(await screen.findByText('File Change View')).toBeInTheDocument();
  });

  it('defaults to Reply for other post types', async () => {
    const fsPost = { ...basePost, type: 'free_speech' } as Post;
    render(
      <BrowserRouter>
        <ReactionControls post={fsPost} user={{ id: 'u1' }} />
      </BrowserRouter>
    );
    expect(await screen.findByText('Reply')).toBeInTheDocument();
  });

  it('toggles expanded view for tasks', async () => {
    render(
      <BrowserRouter>
        <ReactionControls post={basePost} user={{ id: 'u1' }} />
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
          user={{ id: 'u1' }}
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
        <ReactionControls post={fsPost} user={{ id: 'u1' }} />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByText('Reply'));
    expect(navigateMock).toHaveBeenCalledWith('/post/p1?reply=1');
  });
});
