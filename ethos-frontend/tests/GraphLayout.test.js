import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('../src/hooks/useGit', () => ({
  __esModule: true,
  useGitDiff: jest.fn(() => ({ data: { diffMarkdown: 'diff' }, isLoading: false }))
}));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn()
}), { virtual: true });

jest.mock('../src/contexts/BoardContext', () => ({
  useBoardContext: () => ({
    selectedBoard: 'b1',
    updateBoardItem: jest.fn(),
    appendToBoard: jest.fn(),
    boards: { b1: { boardType: 'post' } },
  })
}));

import { useGitDiff } from '../src/hooks/useGit';
import GraphLayout from '../src/components/layout/GraphLayout';

describe('GraphLayout node interaction', () => {
  it('loads git diff and dispatches event on node click', async () => {
    const posts = [
      {
        id: 'p1',
        type: 'task',
        content: 'Task',
        authorId: 'u1',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
        gitFilePath: 'file.js',
        gitCommitSha: 'abc'
      }
    ];

    const listener = jest.fn();
    window.addEventListener('questTaskSelect', listener);

    render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    fireEvent.click(screen.getAllByText('Task')[1]);

    await waitFor(() => {
      expect(useGitDiff).toHaveBeenCalledWith({
        questId: 'q1',
        filePath: 'file.js',
        commitId: 'abc'
      });
    });

    expect(listener).toHaveBeenCalled();
    expect(screen.getByText('diff')).toBeInTheDocument();
  });

  it('renders condensed nodes with labels', () => {
    const posts = [
      {
        id: 'p1',
        nodeId: 'N1',
        type: 'task',
        content: 'Some very long task content that should be trimmed',
        authorId: 'u1',
        visibility: 'public',
        timestamp: '',
        tags: ['task'],
        collaborators: [],
        linkedItems: [],
      },
    ];

    render(
      React.createElement(GraphLayout, {
        items: posts,
        questId: 'q1',
        condensed: true,
      })
    );

    expect(screen.getByText('N1')).toBeInTheDocument();
    expect(screen.queryByText('Some very long task content')).toBeNull();
  });

  it('expands condensed node on click', () => {
    const posts = [
      {
        id: 'p1',
        nodeId: 'N1',
        type: 'task',
        content: 'Some very long task content that should be trimmed',
        authorId: 'u1',
        visibility: 'public',
        timestamp: '',
        tags: ['task'],
        collaborators: [],
        linkedItems: [],
      },
    ];

    render(
      React.createElement(GraphLayout, {
        items: posts,
        questId: 'q1',
        condensed: true,
      })
    );

    fireEvent.click(screen.getByText('N1'));

    expect(
      screen.getByText('Some very long task content that should be trimmed')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Collapse'));

    expect(
      screen.queryByText('Some very long task content that should be trimmed')
    ).toBeNull();
  });

  it('shows reply form when clicking Reply on a node', () => {
    const posts = [
      {
        id: 'p1',
        type: 'task',
        content: 'Task',
        authorId: 'u1',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
      },
    ];

    render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    fireEvent.click(screen.getAllByText('Task')[1]);
    fireEvent.click(screen.getByText('Reply'));

    expect(screen.getByText('Create Post')).toBeInTheDocument();
  });

  it('dispatches event on node double click', () => {
    const posts = [
      {
        id: 'p1',
        type: 'task',
        content: 'Task',
        authorId: 'u1',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
      },
    ];

    const listener = jest.fn();
    window.addEventListener('questTaskOpen', listener);

    render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    fireEvent.doubleClick(screen.getAllByText('Task')[1]);

    expect(listener).toHaveBeenCalled();
  });
});
