import React from 'react';
import { render, act } from '@testing-library/react';

let dragHandler: any;

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

jest.mock('../src/contexts/BoardContext', () => ({
  useBoardContext: () => ({
    selectedBoard: 'b1',
    updateBoardItem: jest.fn(),
    removeItemFromBoard: jest.fn(),
    boards: { b1: { boardType: 'post' } },
  }),
}));

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
  useSensors: (...s: any[]) => s,
  PointerSensor: jest.fn(),
  closestCenter: jest.fn(),
}), { virtual: true });

jest.mock('../src/hooks/useGit', () => ({
  useGitDiff: () => ({ data: null, isLoading: false })
}));

import GraphLayout from '../src/components/layout/GraphLayout';

describe('GraphLayout abstract edge', () => {
  it('creates abstract edge when dropping onto descendant', async () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'A', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p2', type: 'task', content: 'B', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p3', type: 'task', content: 'C', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];
    const edges = [{ from: 'p1', to: 'p2' }, { from: 'p2', to: 'p3' }];

    const { container } = render(React.createElement(GraphLayout, { items: posts, edges, questId: 'q1' }));

    await act(async () => {
      await dragHandler({ active: { id: 'p1' }, over: { id: 'p3' } });
    });

    const dashed = container.querySelectorAll('svg path[stroke-dasharray]');
    expect(dashed.length).toBe(1);
  });
});
