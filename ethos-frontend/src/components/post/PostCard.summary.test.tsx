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
  it('renders node id, status, and username tags', () => {
    const enriched = { ...post, author: { id: 'u1', username: 'alice' } } as Post;
    render(
      <BrowserRouter>
        <PostCard post={enriched} questTitle="Quest A" />
      </BrowserRouter>
    );
    expect(screen.getByText('Q::Task:T1')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    const userLink = screen.getByRole('link', { name: '@alice' });
    expect(userLink).toHaveAttribute('href', '/user/u1');
    const nodeLink = screen.getByRole('link', { name: 'Q::Task:T1' });
    expect(nodeLink).toHaveAttribute('href', '/post/p1');
  });

  it('renders node id and username for change requests', () => {
    const changeReq: Post = {
      id: 'p2',
      authorId: 'u1',
      type: 'request' as unknown as Post['type'],
      nodeId: 'Q:slug:T01:C00',
      content: 'Change request',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
    } as unknown as Post;
    const enriched = { ...changeReq, author: { id: 'u1', username: 'alice' } } as Post;
    render(
      <BrowserRouter>
        <PostCard post={enriched} questTitle="Quest A" />
      </BrowserRouter>
    );
    expect(screen.getByText('Q::Task:T01:C00')).toBeInTheDocument();
    const userLink = screen.getByRole('link', { name: '@alice' });
    expect(userLink).toHaveAttribute('href', '/user/u1');
    const nodeLink = screen.getByRole('link', { name: 'Q::Task:T01:C00' });
    expect(nodeLink).toHaveAttribute('href', '/post/p2');
  });
});
