import React from 'react';
import { render, screen } from '@testing-library/react';
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
    selectedBoard: 'b1',
    boards: {
      b1: { id: 'b1', title: 'Board', boardType: 'post', layout: 'grid', items: [], createdAt: '' },
    },
    appendToBoard: jest.fn(),
  }),
}));

const CreatePost = require('../src/components/post/CreatePost').default;

describe('CreatePost title requirement', () => {
  it('title optional for free speech', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} initialType="free_speech" />
      </BrowserRouter>
    );
    const input = screen.getByLabelText('Title');
    expect(input.required).toBe(false);
  });

  it('title required for request posts', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} initialType="request" />
      </BrowserRouter>
    );
    const input = screen.getByLabelText('Title');
    expect(input.required).toBe(true);
  });
});
