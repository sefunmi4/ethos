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
    selectedBoard: null,
    boards: {
      'timeline-board': { id: 'timeline-board', title: 'Timeline', boardType: 'post', layout: 'grid', items: [], createdAt: '' },
    },
    appendToBoard: jest.fn(),
  }),
}));

const CreatePost = require('../src/components/post/CreatePost').default;

describe('Timeline board post types', () => {
  it('shows allowed options for timeline board', () => {
    render(
      <BrowserRouter>
        <CreatePost onCancel={() => {}} boardId="timeline-board" />
      </BrowserRouter>
    );
    const select = screen.getByLabelText('Item Type');
    const options = Array.from(select.querySelectorAll('option')).map(o => o.textContent);
    expect(options).toEqual(['Quest', 'Free Speech', 'Request', 'Review']);
  });
});
