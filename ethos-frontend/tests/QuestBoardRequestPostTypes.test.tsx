import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../src/api/post', () => ({
  __esModule: true,
  addPost: jest.fn(() => Promise.resolve({ id: 'p1' })),
  fetchAllPosts: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../src/api/board', () => ({
  __esModule: true,
  updateBoard: jest.fn(),
}));

jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({
    selectedBoard: null,
    boards: {
      'quest-board': { id: 'quest-board', title: 'Quest', boardType: 'post', layout: 'grid', items: [], createdAt: '' },
    },
    appendToBoard: jest.fn(),
  }),
}));

const mockUseAuth = jest.fn(() => ({ user: { id: 'u1' } }));
jest.mock('../src/contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
}));

import CreatePost from '../src/components/post/CreatePost';

describe('Quest board request post types', () => {
  it('shows only Task Request option when adding a request', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} boardId="quest-board" initialType="request" />
      </BrowserRouter>
    );
    const select = screen.getByLabelText('Item Type');
    const options = Array.from(select.querySelectorAll('option')).map(o => o.textContent);
    expect(options).toEqual(['Task Request']);
  });
});
