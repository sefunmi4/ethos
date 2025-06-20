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

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
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
});
