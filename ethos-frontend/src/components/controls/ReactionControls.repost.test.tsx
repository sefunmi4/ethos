import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ReactionControls from './ReactionControls';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { addRepost } from '../../api/post';

jest.mock('../../api/post', () => ({
  __esModule: true,
  updateReaction: jest.fn(() => Promise.resolve()),
  addRepost: jest.fn(() => Promise.resolve({ id: 'r1' })),
  removeRepost: jest.fn(() => Promise.resolve()),
  fetchReactions: jest.fn(() => Promise.resolve([])),
  fetchRepostCount: jest.fn(() => Promise.resolve({ count: 0 })),
  fetchUserRepost: jest.fn(() => Promise.resolve(null)),
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

describe('ReactionControls repost persistence', () => {
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
  } as Post;
  const user = { id: 'u2' } as User;

  it('keeps repost state after rerender', async () => {
    const onUpdate = jest.fn();
    const { rerender } = render(
      <BrowserRouter>
        <ReactionControls post={basePost} user={user} onUpdate={onUpdate} />
      </BrowserRouter>
    );

    const btn = await screen.findByLabelText('Repost');
    await waitFor(() => expect(btn).not.toBeDisabled());
    fireEvent.click(btn);
    await waitFor(() => expect(addRepost).toHaveBeenCalled());
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ userRepostId: 'r1' })));

    rerender(
      <BrowserRouter>
        <ReactionControls post={{ ...basePost, userRepostId: 'r1' }} user={user} onUpdate={onUpdate} />
      </BrowserRouter>
    );

    expect(await screen.findByLabelText('Repost')).toHaveClass('text-indigo-600');
  });
});
