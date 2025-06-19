const React = require('react');
const { render, act } = require('@testing-library/react');
const GridLayout = require('../src/components/layout/GridLayout').default;

// Capture the drag handler to simulate drag end
let dragHandler;

jest.mock('@dnd-kit/core', () => ({
  __esModule: true,
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

jest.mock('@dnd-kit/utilities', () => ({ __esModule: true, CSS: { Translate: { toString: () => '' } } }), { virtual: true });

jest.mock('../src/api/post', () => ({
  __esModule: true,
  updatePost: jest.fn((id, data) => Promise.resolve({ id, ...data })),
  archivePost: jest.fn(() => Promise.resolve({ success: true }))
}));

const updateBoardItem = jest.fn();

jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ selectedBoard: 'b1', updateBoardItem })
}));

const { updatePost, archivePost } = require('../src/api/post');

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

  it('archives post when dropped in Done column', async () => {
    render(React.createElement(GridLayout, { items: [basePost], questId: 'q1', layout: 'kanban' }));

    await act(async () => {
      await dragHandler({
        active: { id: basePost.id, data: { current: { item: basePost } } },
        over: { id: 'Done' }
      });
    });

    expect(updatePost).toHaveBeenCalledWith('t1', { status: 'Done' });
    expect(archivePost).toHaveBeenCalledWith('t1');
  });
});
