import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { jest } from '@jest/globals';
import { fetchPostById } from '../../api/post';

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  fetchPostById: jest.fn(),
  updatePost: jest.fn(),
  removeHelpRequest: jest.fn(),
  createJoinRequest: jest.fn(),
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

describe('PostCard review linked title', () => {
  it('shows linked post title for review posts on quest board', async () => {
    const post: Post = {
      id: 'p1',
      authorId: 'u1',
      type: 'review',
      content: 'review',
      visibility: 'public',
      timestamp: '',
      tags: ['review'],
      collaborators: [],
      linkedItems: [
        { itemId: 'f1', itemType: 'post', title: 'File Header' },
      ],
    } as Post;
    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' } as User} boardId="quest-board" />
      </BrowserRouter>
    );
    expect(await screen.findByText('File Header')).toBeInTheDocument();
  });

  it('fetches linked post title when missing', async () => {
    const post: Post = {
      id: 'p1',
      authorId: 'u1',
      type: 'review',
      content: 'review',
      visibility: 'public',
      timestamp: '',
      tags: ['review'],
      collaborators: [],
      linkedItems: [
        { itemId: 'f1', itemType: 'post' },
      ],
    } as Post;
    (fetchPostById as jest.Mock).mockResolvedValueOnce({ id: 'f1', title: 'Fetched File', content: '' });
    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' } as User} boardId="quest-board" />
      </BrowserRouter>
    );
    expect(await screen.findByText('Fetched File')).toBeInTheDocument();
  });
});
