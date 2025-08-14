import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReactionControls from './ReactionControls';
import ContributionCard from '../contribution/ContributionCard';

// mock auth context for RequestCard
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', username: 'user' } }),
}));

const requestHelp = jest.fn();
const removeHelpRequest = jest.fn();
const fetchReactions = jest.fn(() => Promise.resolve([]));
const fetchRepostCount = jest.fn(() => Promise.resolve({ count: 0 }));
const fetchUserRepost = jest.fn(() => Promise.resolve(null));
const addRepost = jest.fn(() => Promise.resolve({ id: 'r1' }));
const removeRepost = jest.fn(() => Promise.resolve());

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchReactions: (...args: unknown[]) => fetchReactions(...args),
  fetchRepostCount: (...args: unknown[]) => fetchRepostCount(...args),
  fetchUserRepost: (...args: unknown[]) => fetchUserRepost(...args),
  addRepost: (...args: unknown[]) => addRepost(...args),
  removeRepost: (...args: unknown[]) => removeRepost(...args),
  requestHelp: (...args: unknown[]) => requestHelp(...args),
  removeHelpRequest: (...args: unknown[]) => removeHelpRequest(...args),
}));

const navigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => navigate,
  };
});

const appendToBoard = jest.fn();

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ appendToBoard }),
}));

describe('review request quest board flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds RequestCard to quest board when requesting review', async () => {
    const onUpdate = jest.fn();
    requestHelp.mockResolvedValue({
      post: {
        id: 'f1',
        authorId: 'u1',
        type: 'file',
        content: 'file',
        visibility: 'public',
        timestamp: '',
        tags: ['review', 'request'],
        collaborators: [],
        linkedItems: [],
      },
    });

    render(
      <BrowserRouter>
        <ReactionControls
          post={{
            id: 'f1',
            authorId: 'u1',
            type: 'file',
            content: 'file',
            visibility: 'public',
            tags: [],
            collaborators: [],
            linkedItems: [],
          }}
          user={{ id: 'u1' }}
          onUpdate={onUpdate}
        />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Request Review')).toBeEnabled());
    fireEvent.click(screen.getByText('Request Review'));

    await waitFor(() => expect(requestHelp).toHaveBeenCalledWith('f1', 'file'));
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(appendToBoard).toHaveBeenCalledWith('quest-board', expect.objectContaining({ id: 'f1' }));

    const updatedPost = onUpdate.mock.calls[0][0];
    render(
      <BrowserRouter>
        <ContributionCard contribution={updatedPost} boardId="quest-board" />
      </BrowserRouter>
    );
    expect(screen.getByText('Submit Review')).toBeInTheDocument();
    expect(updatedPost.tags).toEqual(expect.arrayContaining(['review', 'request']));
  });

  it('removes RequestCard and tags when cancelling review', async () => {
    const onUpdate = jest.fn();
    removeHelpRequest.mockResolvedValue({});

    const postWithRequest = {
      id: 'f1',
      authorId: 'u1',
      type: 'file',
      content: 'file',
      visibility: 'public',
      timestamp: '',
      tags: ['review', 'request'],
      collaborators: [],
      linkedItems: [],
    };

    render(
      <BrowserRouter>
        <ReactionControls post={postWithRequest} user={{ id: 'u1' }} onUpdate={onUpdate} />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Requested')).toBeEnabled());
    fireEvent.click(screen.getByText('Requested'));

    await waitFor(() => expect(removeHelpRequest).toHaveBeenCalledWith('f1', 'file'));
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(appendToBoard).not.toHaveBeenCalled();

    const updatedPost = onUpdate.mock.calls[0][0];
    expect(updatedPost.tags).not.toEqual(expect.arrayContaining(['review', 'request']));

    render(
      <BrowserRouter>
        <ContributionCard contribution={updatedPost} boardId="quest-board" />
      </BrowserRouter>
    );
    expect(screen.queryByText('Submit Review')).not.toBeInTheDocument();
  });
});
