import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

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

const mockUseAuth = jest.fn(() => ({ user: { id: 'u1' } }));
jest.mock('../src/contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
}));

// Avoid LinkControls side effects
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
    fireEvent.change(screen.getByLabelText('Task Title'), { target: { value: 'Need help' } });
    fireEvent.click(screen.getByText('Create Post'));
    await waitFor(() => expect(addPost).toHaveBeenCalled());
    expect(window.alert).not.toHaveBeenCalled();
  });
});
