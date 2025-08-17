import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RequestCard from '../src/components/request/RequestCard';
import type { EnrichedPost } from '../src/types/postTypes';

jest.mock('../src/api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  updatePost: jest.fn(() => Promise.resolve({})),
  fetchPostsByQuestId: jest.fn(() => Promise.resolve([])),
  fetchReactions: jest.fn(() => Promise.resolve([])),
  fetchRepostCount: jest.fn(() => Promise.resolve({ count: 0 })),
  fetchUserRepost: jest.fn(() => Promise.resolve(null)),
  addRepost: jest.fn(() => Promise.resolve({ id: 'r1' })),
  removeRepost: jest.fn(() => Promise.resolve()),
  requestHelp: jest.fn(() => Promise.resolve({})),
  acceptRequest: jest.fn(() => Promise.resolve({})),
  unacceptRequest: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../src/api/quest', () => ({
  __esModule: true,
  linkPostToQuest: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../src/hooks/useGraph', () => ({
  __esModule: true,
  useGraph: () => ({ loadGraph: jest.fn() }),
}));

jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({
    selectedBoard: 'b1',
    updateBoardItem: jest.fn(),
    boards: { b1: { boardType: 'post' } },
    appendToBoard: jest.fn(),
  }),
}));

jest.mock('../src/contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ user: { id: 'u1' } }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

import { acceptRequest, unacceptRequest } from '../src/api/post';

describe('request card join button', () => {
  const post = {
    id: 'p1',
    authorId: 'u2',
    type: 'task',
    content: 'help me',
    visibility: 'public',
    timestamp: '',
    tags: ['request'],
    collaborators: [],
    linkedItems: [],
  } as EnrichedPost;

  it('shows accept button for request posts', () => {
    render(
      <BrowserRouter>
        <RequestCard post={post} />
      </BrowserRouter>
    );
    expect(screen.getByText('Request Join')).toBeInTheDocument();
  });

  it('calls API when clicked', async () => {
    render(
      <BrowserRouter>
        <RequestCard post={post} />
      </BrowserRouter>
    );
    const btn = await screen.findByText('Request Join');
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(acceptRequest).toHaveBeenCalledWith('p1');
  });

  it('toggles pending state on second click', async () => {
    render(
      <BrowserRouter>
        <RequestCard post={post} />
      </BrowserRouter>
    );
    const btn = await screen.findByText('Request Join');
    await act(async () => {
      fireEvent.click(btn);
    });
    const joined = await screen.findByText(/Joined/);
    await act(async () => {
      fireEvent.click(joined);
    });
    expect(unacceptRequest).toHaveBeenCalledWith('p1');
  });

  it('hides join button for existing collaborators', () => {
    const collabPost = {
      ...post,
      enrichedCollaborators: [{ userId: 'u1' }],
    } as EnrichedPost;
    render(
      <BrowserRouter>
        <RequestCard post={collabPost} />
      </BrowserRouter>
    );
    expect(screen.queryByText('Request Join')).not.toBeInTheDocument();
  });

  it('hides join button for the task creator', () => {
    const authorPost = {
      ...post,
      authorId: 'u1',
    } as EnrichedPost;
    render(
      <BrowserRouter>
        <RequestCard post={authorPost} />
      </BrowserRouter>
    );
    expect(screen.queryByText('Request Join')).not.toBeInTheDocument();
  });
});
