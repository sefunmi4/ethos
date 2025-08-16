import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '../src/components/post/PostCard';
import type { Post } from '../src/types/postTypes';
import type { User } from '../src/types/userTypes';
import { removeHelpRequest } from '../src/api/post';

jest.mock('../src/api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  removeHelpRequest: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('../src/api/auth', () => ({
  __esModule: true,
  fetchUserById: jest.fn(id => Promise.resolve({ id, username: 'alice' })),
}));

jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ selectedBoard: 'quest-board' }),
}));

jest.mock('../src/hooks/useGraph', () => ({
  __esModule: true,
  useGraph: () => ({ loadGraph: jest.fn() }),
}));

describe('PostCard request CTA', () => {
  const post: Post = {
    id: 'p1',
    authorId: 'u1',
    type: 'task',
    content: 'Task',
    visibility: 'public',
    timestamp: '',
    tags: ['request'],
    collaborators: [],
    linkedItems: [],
  } as unknown as Post;

  it('shows request tag and allows cancel', async () => {
    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' } as User} />
      </BrowserRouter>
    );
    const tag = await screen.findByText('Request');
    fireEvent.click(tag);
    expect(removeHelpRequest).toHaveBeenCalledWith('p1', 'task');
  });
});
