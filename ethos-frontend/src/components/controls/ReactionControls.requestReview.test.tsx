import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ReactionControls from './ReactionControls';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { requestHelp } from '../../api/post';

jest.mock('../../api/post', () => ({
  __esModule: true,
  updateReaction: jest.fn(() => Promise.resolve()),
  fetchReactions: jest.fn(() => Promise.resolve([])),
  requestHelp: jest.fn(() =>
    Promise.resolve({
      post: {
        id: 'f1',
        authorId: 'u1',
        type: 'file',
        content: 'File',
        visibility: 'public',
        timestamp: '',
        tags: ['review'],
        collaborators: [],
        linkedItems: [],
        helpRequest: true,
      },
    })
  ),
  removeHelpRequest: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ appendToBoard: jest.fn(), selectedBoard: null }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe('ReactionControls request review', () => {
  const post: Post = {
    id: 'f1',
    authorId: 'u1',
    type: 'file',
    content: 'File',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
  } as Post;
  const user = { id: 'u1' } as User;

  it('adds request tag when requesting review', async () => {
    const onUpdate = jest.fn();
    render(
      <BrowserRouter>
        <ReactionControls post={post} user={user} onUpdate={onUpdate} />
      </BrowserRouter>
    );

    const btn = await screen.findByText(/Request Review/i);
    await waitFor(() => expect(btn).not.toBeDisabled());
    fireEvent.click(btn);

    await waitFor(() => expect(requestHelp).toHaveBeenCalledWith('f1', 'file'));
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());

    const updatedPost = onUpdate.mock.calls[0][0] as Post;
    expect(updatedPost.tags).toContain('review');
    expect(updatedPost.tags).toContain('request');
  });
});

