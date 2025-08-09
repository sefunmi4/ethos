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

// Avoid LinkControls side effects
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('../src/components/controls/LinkControls', () => ({
  __esModule: true,
  default: () => <div />,
}));
import CreatePost from '../src/components/post/CreatePost';
import { addPost } from '../src/api/post';

describe('CreatePost request without task', () => {
  it('submits request without requiring a linked task', async () => {
    window.alert = jest.fn();
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} initialType="request" />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Need help' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Assist me' } });
    fireEvent.click(screen.getByText('Create Post'));
    await waitFor(() => expect(addPost).toHaveBeenCalled());
    expect(window.alert).not.toHaveBeenCalled();
  });
});
