import React from 'react';
import { render, act, within } from '@testing-library/react';

let dragHandler;

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

jest.mock('@dnd-kit/core', () => ({
  __esModule: true,
  DndContext: ({ onDragEnd, children }) => {
    dragHandler = onDragEnd;
    return React.createElement(React.Fragment, {}, children);
  },
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
  useSensor: jest.fn(),
  useSensors: (...s) => s,
  PointerSensor: jest.fn(),
  closestCenter: jest.fn(),
}), { virtual: true });

jest.mock('../src/hooks/useGit', () => ({
  useGitDiff: () => ({ data: null, isLoading: false })
}));

import GraphLayout from '../src/components/layout/GraphLayout';

describe('GraphLayout anchor interaction', () => {
  it('creates a new child when dragging from anchor', async () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'Parent', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];

    const { container } = render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    await act(async () => {
      await dragHandler({ active: { id: 'anchor-p1' }, over: null });
    });

    const root = container.querySelector('div.relative');
    expect(within(root).getByText('Parent')).toBeInTheDocument();
    expect(within(root).getByText('New Task')).toBeInTheDocument();
  });

  it('moves subtree when using move handle', async () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'A', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p2', type: 'task', content: 'B', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];

    const { container } = render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    await act(async () => {
      await dragHandler({ active: { id: 'move-p2' }, over: { id: 'p1' } });
    });

    const root = container.firstElementChild.querySelector('div.relative');
    expect(within(root).getByText('A')).toBeInTheDocument();
    expect(within(root).getByText('B')).toBeInTheDocument();
  });
});
