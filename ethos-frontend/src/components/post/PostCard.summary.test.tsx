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

describe.skip('PostCard summary tags', () => {
  it('renders summary tags with quest title and node id', () => {
    render(
      <BrowserRouter>
        <PostCard post={post} questTitle="Quest A" />
      </BrowserRouter>
    );
    expect(screen.getByText('Quest: Quest A')).toBeInTheDocument();
    expect(screen.getByText('Task: T1')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });
});
