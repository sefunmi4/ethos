import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ReactionControls from './ReactionControls';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

jest.mock('../../api/post', () => ({
  __esModule: true,
  updateReaction: jest.fn(() => Promise.resolve()),
  fetchReactions: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ selectedBoard: null }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe('ReactionControls permissions', () => {
  const user = { id: 'u1' } as User;

  it('shows Reply instead of Review for non-authors of file posts', async () => {
    const post = {
      id: 'p1',
      authorId: 'u2',
      type: 'file',
      content: '',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
    } as Post;

    render(
      <BrowserRouter>
        <ReactionControls post={post} user={user} />
      </BrowserRouter>
    );

    expect(await screen.findByText('Reply')).toBeInTheDocument();
    expect(screen.queryByText(/Review/)).toBeNull();
  });

  it('shows Reply instead of Request for non-authors of task posts', async () => {
    const post = {
      id: 'p2',
      authorId: 'u3',
      type: 'task',
      content: '',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
    } as Post;

    render(
      <BrowserRouter>
      <ReactionControls post={post} user={user} />
      </BrowserRouter>
    );

    const replies = await screen.findAllByText('Reply');
    expect(replies).toHaveLength(1);
    expect(screen.queryByText(/Request/)).toBeNull();
  });
});
