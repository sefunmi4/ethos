import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RequestCard from './RequestCard';
import type { Post } from '../../types/postTypes';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', xp: 0 } }),
}));

jest.mock('../../api/post', () => ({
  acceptRequest: jest.fn(),
  unacceptRequest: jest.fn(),
}));

describe('RequestCard summary tag', () => {
  const basePost: Post = {
    id: 'p1',
    authorId: 'u2',
    type: 'file',
    content: 'content',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
  } as unknown as Post;

  it('shows Review tag for review requests', () => {
    const post = { ...basePost, tags: ['review', 'request'] } as Post;
    render(
      <BrowserRouter>
        <RequestCard post={post as any} />
      </BrowserRouter>
    );
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.queryByText('Request')).toBeNull();
  });

  it('shows Request tag for standard requests', () => {
    const post = { ...basePost, tags: ['request'], type: 'task' as any } as Post;
    render(
      <BrowserRouter>
        <RequestCard post={post as any} />
      </BrowserRouter>
    );
    expect(screen.getByText('Request')).toBeInTheDocument();
    expect(screen.queryByText('Review')).toBeNull();
  });
});

