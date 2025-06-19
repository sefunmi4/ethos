const React = require('react');
const { render, act } = require('@testing-library/react');
const GridLayout = require('../src/components/layout/GridLayout').default;

// Capture the drag handler to simulate drag end
let dragHandler;

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ onDragEnd, children }) => {
    dragHandler = onDragEnd;
    return React.createElement('div', {}, children);
  },
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}), { virtual: true });

jest.mock('@dnd-kit/utilities', () => ({ CSS: { Translate: { toString: () => '' } } }), { virtual: true });

jest.mock('../src/api/post', () => ({
  updatePost: jest.fn(() => Promise.resolve({ id: 't1', status: 'In Progress' }))
}));

const updateBoardItem = jest.fn();

jest.mock('../src/contexts/BoardContext', () => ({
  useBoardContext: () => ({ selectedBoard: 'b1', updateBoardItem })
}));

const { updatePost } = require('../src/api/post');

const basePost = {
  id: 't1',
  type: 'task',
  content: 'Task 1',
  authorId: 'u1',
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: [],
  status: 'To Do'
};

describe('GridLayout kanban drag', () => {
  it('calls updatePost and updates board state', async () => {
    render(React.createElement(GridLayout, { items: [basePost], questId: 'q1', layout: 'kanban' }));

    await act(async () => {
      await dragHandler({
        active: { id: basePost.id, data: { current: { item: basePost } } },
        over: { id: 'In Progress' }
      });
    });

    expect(updatePost).toHaveBeenCalledWith('t1', { status: 'In Progress' });
    expect(updateBoardItem).toHaveBeenCalledWith('b1', { id: 't1', status: 'In Progress' });
  });
});
