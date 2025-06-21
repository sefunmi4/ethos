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
    },
    appendToBoard: jest.fn(),
  }),
}));

import CreatePost from '../src/components/post/CreatePost';

describe('CreatePost view filtering', () => {
  const getOptions = () => {
    const select = screen.getByLabelText('Item Type');
    return Array.from(select.querySelectorAll('option')).map(o => o.textContent);
  };

  it('allows only task posts in map view', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} currentView="map" />
      </BrowserRouter>
    );
    expect(getOptions()).toEqual(['Quest Task']);
  });

  it('allows log posts in log view', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} currentView="log" />
      </BrowserRouter>
    );
    expect(getOptions()).toEqual(['Quest Log']);
  });

  it('allows commit and log posts in file-change view', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} currentView="file-change" />
      </BrowserRouter>
    );
    expect(getOptions()).toEqual(['Commit', 'Quest Log']);
  });
});
