import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuestBoard from '../src/components/quest/QuestBoard';

const mockBoard = {
  id: 'quest-board',
  enrichedItems: [
    { id: 'p1', type: 'task', content: 'Task', tags: ['request'] },
    { id: 'f1', type: 'file', content: 'File', tags: ['review'] },
  ],
};

jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ boards: { 'quest-board': mockBoard } }),
}));

jest.mock('../src/contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ user: null }),
}));

jest.mock('../src/components/board/Board', () => ({
  __esModule: true,
  default: (props: { filter: unknown }) => (
    <div data-testid="board-filter">{JSON.stringify(props.filter)}</div>
  ),
}));

jest.mock('../src/components/board/PostTypeFilter', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select data-testid="post-type-filter" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">All Posts</option>
      <option value="request">Requests</option>
      <option value="review">Reviews</option>
    </select>
  ),
}));

test('passes selected post type to Board filter', () => {
  render(
    <BrowserRouter>
      <QuestBoard />
    </BrowserRouter>
  );
  const filter = screen.getByTestId('post-type-filter');
  fireEvent.change(filter, { target: { value: 'review' } });
  expect(screen.getByTestId('board-filter').textContent).toBe(
    JSON.stringify({ postType: 'review' })
  );
});

