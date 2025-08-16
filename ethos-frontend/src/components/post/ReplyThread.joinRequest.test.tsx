import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReplyThread from './ReplyThread';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

const mockReplies: Post[] = [
  {
    id: 'r1',
    authorId: 'u2',
    author: { id: 'u2', username: 'alice' },
    type: 'free_speech',
    content: '',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
    system_event: 'join_request',
    status: 'Pending',
  } as unknown as Post,
];

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve(mockReplies)),
}));

type Listener = (...args: unknown[]) => void;
const listeners: Record<string, Listener> = {};
const socket = {
  emit: jest.fn(),
  on: jest.fn((event: string, handler: Listener) => {
    listeners[event] = handler;
  }),
  off: jest.fn((event: string) => {
    delete listeners[event];
  }),
};

jest.mock('../../hooks/useSocket', () => ({
  __esModule: true,
  useSocket: () => ({ socket }),
}));

describe('ReplyThread join request events', () => {
  it('renders join request and updates on socket events', async () => {
    render(
      <BrowserRouter>
        <ReplyThread postId="p1" user={{ id: 'u1' } as User} />
      </BrowserRouter>,
    );

    expect(
      await screen.findByText('@alice requested to join this task • Pending'),
    ).toBeInTheDocument();

    act(() => {
      listeners['join_request:update']?.({ postId: 'r1', status: 'Approved' });
    });

    expect(
      await screen.findByText('@alice requested to join this task • Approved'),
    ).toBeInTheDocument();
  });
});

