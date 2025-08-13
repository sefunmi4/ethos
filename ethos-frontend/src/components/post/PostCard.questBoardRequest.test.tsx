import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { jest } from '@jest/globals';

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
  type: 'task',
  content: 'Help me',
  status: 'In Progress',
  visibility: 'public',
  timestamp: '2023-01-01T00:00:00Z',
  tags: ['request'],
  collaborators: [],
  linkedItems: [],
} as unknown as Post;

it('hides status controls and shows only request tag', async () => {
  render(
    <BrowserRouter>
      <PostCard post={post} user={{ id: 'u1' } as User} />
    </BrowserRouter>
  );
  expect(await screen.findByText('Request')).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: '@alice' })).toBeInTheDocument();
  expect(screen.queryByText('In Progress')).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(await screen.findByText('1 day ago')).toBeInTheDocument();
});
