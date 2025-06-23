import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import { jest } from '@jest/globals';

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ selectedBoard: 'quest-board' }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date('2023-01-02T00:00:00Z'));
});

afterAll(() => {
  jest.useRealTimers();
});

const post: Post = {
  id: 'p1',
  authorId: 'u1',
  type: 'request',
  content: 'Help me',
  status: 'In Progress',
  visibility: 'public',
  timestamp: '2023-01-01T00:00:00Z',
  tags: [],
  collaborators: [],
  linkedItems: [],
} as unknown as Post;

it('hides status controls and shows only request tag', () => {
  render(
    <BrowserRouter>
      <PostCard post={post} user={{ id: 'u1' }} />
    </BrowserRouter>
  );

  expect(screen.getByText('Request: @u1')).toBeInTheDocument();
  expect(screen.queryByText('In Progress')).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.getByText('1 day ago')).toBeInTheDocument();
});
