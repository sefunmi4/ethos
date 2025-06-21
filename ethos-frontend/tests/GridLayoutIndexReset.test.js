import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

// Mock ESM-only deps used deep in GridLayout to avoid Jest ESM parsing issues
jest.mock('react-markdown', () => () => null, { virtual: true });
jest.mock('remark-gfm', () => () => ({}), { virtual: true });

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}), { virtual: true });

global.updateBoardItemMock = jest.fn();
global.removeItemFromBoardMock = jest.fn();

jest.mock('../src/contexts/BoardContext', () => ({
  useBoardContext: () => ({
    selectedBoard: 'b1',
    updateBoardItem: global.updateBoardItemMock,
    removeItemFromBoard: global.removeItemFromBoardMock,
    boards: { b1: { boardType: 'post' } }
  })
}));

import GridLayout from '../src/components/layout/GridLayout';

const makePost = id => ({
  id,
  type: 'task',
  content: 'Task',
  authorId: 'u1',
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: []
});

describe.skip('GridLayout index reset', () => {
  it('resets index when items are removed', () => {
    HTMLElement.prototype.scrollTo = jest.fn();
    const posts = [makePost('p1'), makePost('p2'), makePost('p3')];
    const { container, rerender } = render(
      React.createElement(GridLayout, { items: posts, questId: 'q1', layout: 'horizontal' })
    );

    fireEvent.click(screen.getByText('▶'));
    fireEvent.click(screen.getByText('▶'));

    let dots = container.querySelectorAll('div.flex.justify-center button');
    expect(dots).toHaveLength(3);
    expect(dots[2].className).toContain('bg-accent');

    rerender(
      React.createElement(GridLayout, { items: posts.slice(0, 2), questId: 'q1', layout: 'horizontal' })
    );

    dots = container.querySelectorAll('div.flex.justify-center button');
    expect(dots).toHaveLength(2);
    expect(dots[1].className).toContain('bg-accent');
  });
});
