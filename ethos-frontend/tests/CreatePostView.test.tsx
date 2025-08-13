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
      b1: { id: 'b1', title: 'Board', boardType: 'quest', layout: 'grid', items: [], createdAt: '' },
    },
    appendToBoard: jest.fn(),
  }),
}));

import CreatePost from '../src/components/post/CreatePost';

describe.skip('CreatePost view filtering', () => {
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

  it('allows free speech posts in log view', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} currentView="log" />
      </BrowserRouter>
    );
    expect(getOptions()).toEqual(['Free Speech']);
  });

  it('allows file and free speech posts in file-change view', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} currentView="file-change" />
      </BrowserRouter>
    );
    expect(getOptions()).toEqual(['File', 'Free Speech']);
  });
});
