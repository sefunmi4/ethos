import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('../src/api/post', () => ({
  __esModule: true,
  addPost: jest.fn(() => Promise.resolve({ id: 'p1' })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('../src/api/board', () => ({
  __esModule: true,
  updateBoard: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({
    selectedBoard: null,
    boards: {},
    appendToBoard: jest.fn(),
  }),
}));

import CreatePost from '../src/components/post/CreatePost';

import { addPost } from '../src/api/post';

describe('CreatePost replying', () => {
  it('limits options to log when replying to a task', () => {
    const reply = { id: 't1', type: 'task' } as Post;
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
