import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({}),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe('PostCard review rating', () => {
  it('renders rating stars for review posts', () => {
    const post: Post = {
      id: 'r1',
      authorId: 'u1',
      type: 'change',
      content: 'Great quest',
      rating: 4.5,
      visibility: 'public',
      timestamp: '',
      tags: ['review'],
      collaborators: [],
      linkedItems: [],
    } as unknown as Post;

    render(
      <BrowserRouter>
        <PostCard post={post} />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('Rating: 4.5')).toBeInTheDocument();
  });
});
