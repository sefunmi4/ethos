import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { Post } from '../src/types/postTypes';

jest.mock('../src/api/post', () => ({
  __esModule: true,
  addPost: jest.fn(() => Promise.resolve({ id: 'p1' })),
}));

jest.mock('../src/api/board', () => ({
  __esModule: true,
  updateBoard: jest.fn(),
}));

jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({
    selectedBoard: null,
    boards: {},
    appendToBoard: jest.fn(),
  }),
}));

const mockUseAuth = jest.fn();
jest.mock('../src/contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
}));

import CreatePost from '../src/components/post/CreatePost';

import { addPost } from '../src/api/post';

describe('CreatePost replying', () => {
  it('offers free speech, task, and change when replying to a task as a participant', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
    const reply = { id: 't1', type: 'task', authorId: 'u1' } as Post;
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} replyTo={reply} />
      </BrowserRouter>
    );
    const options = Array.from(
      screen.getByLabelText('Item Type').querySelectorAll('option')
    ).map((o) => o.textContent);
    expect(options).toEqual(['Free Speech', 'Task', 'Change']);
  });

  it('offers only free speech when replying to a task as an outsider', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u2' } });
    const reply = { id: 't1', type: 'task', authorId: 'u1', collaborators: [] } as Post;
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} replyTo={reply} />
      </BrowserRouter>
    );
    const options = Array.from(
      screen.getByLabelText('Item Type').querySelectorAll('option')
    ).map((o) => o.textContent);
    expect(options).toEqual(['Free Speech']);
  });

  it('includes reply questId in payload', async () => {
    const reply = { id: 'r1', type: 'task', questId: 'q123' } as Post;
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} replyTo={reply} />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 't' } });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'content' },
    });
    fireEvent.click(screen.getByText('Create Post'));
    await waitFor(() => expect(addPost).toHaveBeenCalled());
    expect(addPost).toHaveBeenCalledWith(
      expect.objectContaining({ questId: 'q123' })
    );
  });
});
