import React from 'react';
import { render, screen } from '@testing-library/react';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';

jest.mock('../layout/MapGraphLayout', () => () => <div data-testid="map" />);
jest.mock('../git/GitFileBrowserInline', () => () => <div>File Browser</div>);
jest.mock('../quest/TeamPanel', () => () => <div>Team Panel</div>);
jest.mock('../../hooks/useGraph', () => ({ useGraph: () => ({ nodes: [], edges: [], loadGraph: jest.fn() }) }));

jest.mock('../../api/auth', () => ({
  __esModule: true,
  fetchUserById: jest.fn((id) => Promise.resolve({ id, username: 'alice' })),
}));

const task: Post = {
  id: 't1',
  authorId: 'u1',
  type: 'task',
  content: 'Task content',
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: [],
  status: 'To Do',
  questId: 'q1',
};

test('shows map and file browser in expanded view', async () => {
  render(<PostCard post={task} expanded />);
  expect(await screen.findByTestId('map')).toBeInTheDocument();
  expect(await screen.findByText('File Browser')).toBeInTheDocument();
  expect(await screen.findByText('Options')).toBeInTheDocument();
});
