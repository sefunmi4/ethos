import React from 'react';
import { render, screen } from '@testing-library/react';
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
  useBoardContext: () => ({ selectedBoard: null, boards: {}, appendToBoard: jest.fn() }),
}));

jest.mock('../src/contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ user: { id: 'u1' } }),
}));

import CreatePost from '../src/components/post/CreatePost';

describe('CreatePost reply type restrictions', () => {
  it('only shows free speech when replying to free speech', () => {
    const parent = { id: 'p1', type: 'free_speech', authorId: 'u1' } as Post;
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} replyTo={parent} />
      </BrowserRouter>
    );
    const options = Array.from(screen.getByLabelText('Item Type').querySelectorAll('option')).map(o => o.textContent);
    expect(options).toEqual(['Free Speech']);
  });

  it('shows free speech and review when replying to a file', () => {
    const parent = { id: 'f1', type: 'file', authorId: 'u1' } as Post;
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} replyTo={parent} />
      </BrowserRouter>
    );
    const options = Array.from(screen.getByLabelText('Item Type').querySelectorAll('option')).map(o => o.textContent);
    expect(options).toEqual(['Free Speech', 'Review']);
  });
});
