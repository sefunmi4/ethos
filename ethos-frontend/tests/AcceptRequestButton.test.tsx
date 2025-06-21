import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '../src/components/post/PostCard';

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

jest.mock('react-router-dom', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

import { acceptRequest, unacceptRequest } from '../src/api/post';

describe.skip('accept request button', () => {
  const post = {
    id: 'p1',
    authorId: 'u2',
    type: 'request',
    content: 'help me',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
  } as Post;

  it('shows accept button for request posts', () => {
    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' }} />
      </BrowserRouter>
    );
    expect(screen.getByText('Accept')).toBeInTheDocument();
  });

  it('calls API when clicked', () => {
    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' }} />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByText('Accept'));
    expect(acceptRequest).toHaveBeenCalledWith('p1');
  });

  it('toggles pending state on second click', () => {
    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' }} />
      </BrowserRouter>
    );
    const btn = screen.getByText('Accept');
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(unacceptRequest).toHaveBeenCalledWith('p1');
  });
});
