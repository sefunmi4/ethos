import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import type { Post } from '../../types/postTypes';

const navMock = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { __esModule: true, ...actual, useNavigate: () => navMock };
});

jest.mock('../layout/GraphLayout', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="graph" />),
}));
import GraphLayout from '../layout/GraphLayout';
const graphLayoutMock = GraphLayout as jest.Mock;
jest.mock('../layout/MapGraphLayout', () => () => <div data-testid="map" />);
jest.mock('../git/GitFileBrowserInline', () => () => <div>File Browser</div>);
jest.mock('../quest/TaskKanbanBoard', () => () => <div>Kanban</div>);
jest.mock('../quest/SubtaskChecklist', () => () => <div>Checklist</div>);
jest.mock('../quest/TeamPanel', () => () => <div>Team Panel</div>);
jest.mock('../quest/FileEditorPanel', () => () => <div>Code Panel</div>);

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ selectedBoard: null }),
}));

jest.mock('../../hooks/useGraph', () => ({
  useGraph: () => ({ nodes: [], edges: [], loadGraph: jest.fn() }),
}));

jest.mock('../../api/auth', () => ({
  __esModule: true,
  fetchUserById: jest.fn(id => Promise.resolve({ id, username: 'alice' })),
}));

jest.mock('../../contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));
import { useAuth } from '../../contexts/AuthContext';
const useAuthMock = useAuth as jest.Mock;

import PostCard from './PostCard';

beforeEach(() => {
  navMock.mockReset();
  graphLayoutMock.mockClear();
});

const freeSpeech: Post = {
  id: 'fs1',
  authorId: 'u1',
  type: 'free_speech',
  content: 'a'.repeat(300),
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: [],
};

const filePost: Post = {
  id: 'f1',
  authorId: 'u1',
  type: 'file',
  content: 'file content',
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: [],
  questId: 'q1',
  gitFilePath: 'README.md',
};

const taskPost: Post = {
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
  taskType: 'folder',
};

const projectPost: Post = {
  id: 'p1',
  authorId: 'u1',
  type: 'project',
  content: 'Project content',
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: [],
  questId: 'q1',
};

test('renders free speech post with clamped text and navigates on click', () => {
  useAuthMock.mockReturnValue({ user: { id: 'u2' } });
  const { container } = render(
    <BrowserRouter>
      <PostCard post={freeSpeech} />
    </BrowserRouter>
  );
  expect(container.querySelector('.clamp-4')).toBeInTheDocument();
  const link = screen.getByRole('link');
  fireEvent.keyDown(link, { key: 'Enter' });
  expect(navMock).toHaveBeenCalledWith(ROUTES.POST('fs1'));
});

test('renders file post read-only without edit button', () => {
  useAuthMock.mockReturnValue({ user: { id: 'u2' } });
  render(
    <BrowserRouter>
      <PostCard post={filePost} expanded />
    </BrowserRouter>
  );
  expect(screen.getByText('Code Panel')).toBeInTheDocument();
  expect(screen.queryByText('Edit')).not.toBeInTheDocument();
});

test('renders file post editable when user can edit', () => {
  useAuthMock.mockReturnValue({ user: { id: 'u1' } });
  render(
    <BrowserRouter>
      <PostCard post={filePost} expanded />
    </BrowserRouter>
  );
  expect(screen.getByText('Code Panel')).toBeInTheDocument();
  expect(screen.getByText('Edit')).toBeInTheDocument();
});

test('renders task post with kanban and switches tabs', () => {
  useAuthMock.mockReturnValue({ user: { id: 'u1' } });
  render(
    <BrowserRouter>
      <PostCard post={taskPost} expanded />
    </BrowserRouter>
  );
  expect(screen.getByText('Kanban')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Options'));
  expect(screen.getByText('Team Panel')).toBeInTheDocument();
  fireEvent.click(screen.getAllByText('Planner')[0]);
  expect(screen.getByText('Kanban')).toBeInTheDocument();
});

test('renders project post with graph, navigates on node double click and switches tabs', () => {
  useAuthMock.mockReturnValue({ user: { id: 'u1' } });
  render(
    <BrowserRouter>
      <PostCard post={projectPost} expanded />
    </BrowserRouter>
  );
  expect(screen.getByTestId('graph')).toBeInTheDocument();

  let props = graphLayoutMock.mock.calls[0][0];
  const node = { id: 't2', type: 'task', content: 'Child task' } as Post;
  const nowSpy = jest.spyOn(Date, 'now');
  act(() => {
    nowSpy.mockReturnValue(1000);
    props.onNodeClick(node);
  });
  props = graphLayoutMock.mock.calls[1][0];
  act(() => {
    nowSpy.mockReturnValue(1100);
    props.onNodeClick(node);
  });
  expect(navMock).toHaveBeenCalledWith(ROUTES.POST('t2'));
  nowSpy.mockRestore();

  fireEvent.click(screen.getByText('Options'));
  expect(screen.getByText('Team Panel')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Folders'));
  expect(screen.getByText('Select a task to view its folders.')).toBeInTheDocument();
});
