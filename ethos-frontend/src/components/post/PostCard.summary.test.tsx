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

  it('renders node id and username for file requests', async () => {
    const fileReq: Post = {
      id: 'p2',
      authorId: 'u1',
      type: 'request' as unknown as Post['type'],
      nodeId: 'Q:slug:T01:F00',
      content: 'File request',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
    } as unknown as Post;
    const enriched = { ...fileReq, author: { id: 'u1', username: 'alice' } } as Post;
    render(
      <BrowserRouter>
        <PostCard post={enriched} questTitle="Quest A" />
      </BrowserRouter>
    );
    expect(await screen.findByText('Q::File:T01:F00')).toBeInTheDocument();
    const userLink = await screen.findByRole('link', { name: '@alice' });
    expect(userLink).toHaveAttribute('href', '/user/u1');
    const nodeLink = await screen.findByRole('link', { name: 'Q::File:T01:F00' });
    expect(nodeLink).toHaveAttribute('href', '/post/p2');
  });

  it('renders file, task, and username tags for file posts', async () => {
    const filePost: Post = {
      id: 'f1',
      authorId: 'u1',
      type: 'file',
      nodeId: 'Q:slug:T01:F00',
      content: 'A file',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
      replyTo: 't1',
    } as unknown as Post;
    const enriched = { ...filePost, author: { id: 'u1', username: 'alice' } } as Post;
    render(
      <BrowserRouter>
        <PostCard post={enriched} questTitle="Quest A" />
      </BrowserRouter>
    );
    expect(await screen.findByText('File')).toBeInTheDocument();
    expect(await screen.findByText('Q::Task:T01')).toBeInTheDocument();
    const userLink = await screen.findByRole('link', { name: '@alice' });
    expect(userLink).toHaveAttribute('href', '/user/u1');
    const taskLink = await screen.findByRole('link', { name: 'Q::Task:T01' });
    expect(taskLink).toHaveAttribute('href', '/post/t1');
    const fileLink = await screen.findByRole('link', { name: 'File' });
    expect(fileLink).toHaveAttribute('href', '/post/f1');
    const tags = await screen.findAllByTestId('summary-tag');
    expect(tags).toHaveLength(3);
    expect(tags[0].textContent).toContain('File');
  });
});
