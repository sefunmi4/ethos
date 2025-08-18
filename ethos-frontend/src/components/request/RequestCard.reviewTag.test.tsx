import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RequestCard from './RequestCard';
import type { EnrichedPost, PostTag } from '../../types/postTypes';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', xp: 0 } }),
}));

jest.mock('../../api/post', () => ({
  acceptRequest: jest.fn(),
  unacceptRequest: jest.fn(),
}));

describe('RequestCard summary tag', () => {
  const basePost: EnrichedPost = {
    id: 'p1',
    authorId: 'u2',
    type: 'file',
    content: 'content',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
  };

  it('shows Review tag for review requests', () => {
    const post: EnrichedPost = {
      ...basePost,
      tags: ['review', 'request'] as PostTag[],
    };
    render(
      <BrowserRouter>
        <RequestCard post={post} />
      </BrowserRouter>
    );
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.queryByText('Request')).toBeNull();
  });

  it('shows Request tag for standard requests', () => {
    const post: EnrichedPost = {
      ...basePost,
      tags: ['request'] as PostTag[],
      type: 'task',
    };
    render(
      <BrowserRouter>
        <RequestCard post={post} />
      </BrowserRouter>
    );
    expect(screen.getByText('Request')).toBeInTheDocument();
    expect(screen.queryByText('Review')).toBeNull();
  });
});

