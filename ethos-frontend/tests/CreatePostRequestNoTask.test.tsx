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
    fireEvent.click(screen.getByText('Create Post'));
    await waitFor(() => expect(addPost).toHaveBeenCalled());
    expect(window.alert).not.toHaveBeenCalled();
    const call = (addPost as jest.Mock).mock.calls[0][0];
    expect('linkedItems' in call).toBe(false);
  });

  it('includes linkedItems when questId is provided', async () => {
    (addPost as jest.Mock).mockClear();
    window.alert = jest.fn();
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} initialType="request" questId="q1" />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Need help' } });
    fireEvent.click(screen.getByText('Create Post'));
    await waitFor(() => expect(addPost).toHaveBeenCalled());
    const call = (addPost as jest.Mock).mock.calls[0][0];
    expect(call.linkedItems).toEqual([{ itemId: 'q1', itemType: 'quest' }]);
  });
});
