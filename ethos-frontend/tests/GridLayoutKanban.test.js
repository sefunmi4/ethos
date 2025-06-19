const React = require('react');
const { render, act } = require('@testing-library/react');

// Mock ESM-only deps used deep in GridLayout to avoid Jest ESM parsing issues
jest.mock('react-markdown', () => () => null, { virtual: true });
jest.mock('remark-gfm', () => () => ({}), { virtual: true });

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}), { virtual: true });

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
  updatePost: jest.fn((id, body) => Promise.resolve({ id, ...body })),
  archivePost: jest.fn(() => Promise.resolve({ success: true })),
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([]))
}));


global.updateBoardItemMock = jest.fn();
global.removeItemFromBoardMock = jest.fn();

jest.mock('../src/contexts/BoardContext', () => ({
  useBoardContext: () => ({
    selectedBoard: 'b1',
    updateBoardItem: global.updateBoardItemMock,
    removeItemFromBoard: global.removeItemFromBoardMock
  })
}));

// Capture the drag handler to simulate drag end
let dragHandler;

jest.mock('@dnd-kit/core', () => {
  const React = require('react');
  return {
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
  };
}, { virtual: true });

jest.mock('@dnd-kit/utilities', () => ({ CSS: { Translate: { toString: () => '' } } }), { virtual: true });

const GridLayout = require('../src/components/layout/GridLayout').default;

const updateBoardItem = global.updateBoardItemMock;
const removeItemFromBoard = global.removeItemFromBoardMock;
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

  it('archives and removes item when dropped in Done', async () => {
    render(React.createElement(GridLayout, { items: [basePost], questId: 'q1', layout: 'kanban' }));

    await act(async () => {
      await dragHandler({
        active: { id: basePost.id, data: { current: { item: basePost } } },
        over: { id: 'Done' }
      });
    });

    expect(updatePost).toHaveBeenCalledWith('t1', { status: 'Done' });
    expect(archivePost).toHaveBeenCalledWith('t1');
    expect(removeItemFromBoard).toHaveBeenCalledWith('b1', 't1');
  });
});
