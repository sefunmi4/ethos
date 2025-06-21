import React from 'react';
import { render, screen } from '@testing-library/react';
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
    selectedBoard: 'b1',
    boards: {
      b1: { id: 'b1', title: 'Board', boardType: 'quest', layout: 'grid', items: [], createdAt: '' },
      'quest-board': { id: 'quest-board', title: 'Quest', boardType: 'post', layout: 'grid', items: [], createdAt: '' },
    },
    appendToBoard: jest.fn(),
  }),
}));

import CreatePost from '../src/components/post/CreatePost';

describe.skip('CreatePost board type filtering', () => {
  it('limits post type options for quest board', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} />
      </BrowserRouter>
    );
    const select = screen.getByLabelText('Item Type');
    const options = Array.from(select.querySelectorAll('option')).map(o => o.textContent);
    expect(options).toEqual(['Quest', 'Quest Task', 'Quest Log']);
  });

  it('limits post type options for quest board', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} boardId="quest-board" />
      </BrowserRouter>
    );
    const select = screen.getByLabelText('Item Type');
    const options = Array.from(select.querySelectorAll('option')).map(o => o.textContent);
    expect(options).toEqual(['Request', 'Review', 'Issue', 'Quest Task']);
  });
});
