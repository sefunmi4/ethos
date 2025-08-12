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
  useBoardContext: () => ({})
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

const post: Post = {
  id: 'p1',
  authorId: 'u1',
  type: 'task',
  nodeId: 'T1',
  status: 'In Progress',
  content: 'Task content',
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: [],
} as unknown as Post;

describe('PostCard summary tags', () => {
  it('renders type, quest, status, and username tags', () => {
    const enriched = { ...post, author: { id: 'u1', username: 'alice' } } as Post;
    render(
      <BrowserRouter>
        <PostCard post={enriched} questTitle="Quest A" />
      </BrowserRouter>
    );
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Q:T1')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    const userLink = screen.getByRole('link', { name: '@alice' });
    expect(userLink).toHaveAttribute('href', '/user/u1');
    const typeLink = screen.getByRole('link', { name: 'Task' });
    expect(typeLink).toHaveAttribute('href', '/post/p1');
  });
});
