import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../api/auth', () => ({
  __esModule: true,
  fetchUserById: jest.fn((id) => Promise.resolve({ id, username: 'alice' })),
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
  it('renders node id, status, and username tags', async () => {
    const enriched = { ...post, author: { id: 'u1', username: 'alice' } } as Post;
    render(
      <BrowserRouter>
        <PostCard post={enriched} questTitle="Quest A" />
      </BrowserRouter>
    );
    expect(await screen.findByText('Q::Task:T1')).toBeInTheDocument();
    expect(await screen.findByText('In Progress')).toBeInTheDocument();
    const userLink = await screen.findByRole('link', { name: '@alice' });
    expect(userLink).toHaveAttribute('href', '/user/u1');
    const nodeLink = await screen.findByRole('link', { name: 'Q::Task:T1' });
    expect(nodeLink).toHaveAttribute('href', '/post/p1');
  });

  it('renders node id and username for change requests', async () => {
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
    expect(await screen.findByText('Q::Task:T01:C00')).toBeInTheDocument();
    const userLink = await screen.findByRole('link', { name: '@alice' });
    expect(userLink).toHaveAttribute('href', '/user/u1');
    const nodeLink = await screen.findByRole('link', { name: 'Q::Task:T01:C00' });
    expect(nodeLink).toHaveAttribute('href', '/post/p2');
  });

  it('renders task, change, and username tags for change posts', async () => {
    const changePost: Post = {
      id: 'c1',
      authorId: 'u1',
      type: 'change',
      nodeId: 'Q:slug:T01:C00',
      content: 'A change',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
      replyTo: 't1',
    } as unknown as Post;
    const enriched = { ...changePost, author: { id: 'u1', username: 'alice' } } as Post;
    render(
      <BrowserRouter>
        <PostCard post={enriched} questTitle="Quest A" />
      </BrowserRouter>
    );
    expect(await screen.findByText('Q::Task:T01')).toBeInTheDocument();
    expect(await screen.findByText('Q::Task:T01:C00')).toBeInTheDocument();
    const userLink = await screen.findByRole('link', { name: '@alice' });
    expect(userLink).toHaveAttribute('href', '/user/u1');
    const taskLink = await screen.findByRole('link', { name: 'Q::Task:T01' });
    expect(taskLink).toHaveAttribute('href', '/post/t1');
    const changeLink = await screen.findByRole('link', { name: 'Q::Task:T01:C00' });
    expect(changeLink).toHaveAttribute('href', '/post/c1');
    const tags = await screen.findAllByTestId('summary-tag');
    expect(tags).toHaveLength(3);
  });
});
