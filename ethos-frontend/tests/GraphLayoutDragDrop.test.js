const React = require('react');
const { render, act, within } = require('@testing-library/react');

let isOverMock = false;

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
  }),
}));

let dragHandler;

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
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: isOverMock }),
  useSensor: jest.fn(),
  useSensors: (...s) => s,
  PointerSensor: jest.fn(),
  closestCenter: jest.fn(),
}), { virtual: true });

jest.mock('../src/hooks/useGit', () => ({
  useGitDiff: () => ({ data: null, isLoading: false })
}));

jest.mock('../src/api/quest', () => ({
  linkPostToQuest: jest.fn(() => Promise.resolve({}))
}));

const GraphLayout = require('../src/components/layout/GraphLayout').default;

const { linkPostToQuest } = require('../src/api/quest');

describe('GraphLayout drag and drop', () => {
  it('links tasks on drop and updates hierarchy', async () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'Parent', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p2', type: 'task', content: 'Child', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];

    const { container } = render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    await act(async () => {
      await dragHandler({ active: { id: 'p2' }, over: { id: 'p1' } });
    });

    expect(linkPostToQuest).toHaveBeenCalledWith('q1', { postId: 'p2', parentId: 'p1' });

    const rootContainer = container.firstElementChild;
    const rootNodes = rootContainer.querySelectorAll(':scope > div.relative');
    expect(rootNodes.length).toBe(1);
    const root = rootNodes[0];
    expect(within(root).getByText('Parent')).toBeInTheDocument();
    expect(within(root).getByText('Child')).toBeInTheDocument();
  });

  it('does not duplicate edges on repeated drags', async () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'Parent', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p2', type: 'task', content: 'Child', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];

    const { container } = render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    await act(async () => {
      await dragHandler({ active: { id: 'p2' }, over: { id: 'p1' } });
    });

    await act(async () => {
      await dragHandler({ active: { id: 'p2' }, over: { id: 'p1' } });
    });

    const rootContainer = container.firstElementChild;
    const rootNodes = rootContainer.querySelectorAll(':scope > div.relative');
    expect(rootNodes.length).toBe(1);
    const root = rootNodes[0];
    expect(within(root).getByText('Parent')).toBeInTheDocument();
    const children = within(root).getAllByText('Child');
    expect(children.length).toBe(1);
  });

  it('adds pulse class after hovering over node', () => {
    jest.useFakeTimers();
    isOverMock = true;

    const posts = [
      { id: 'p1', type: 'task', content: 'Parent', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];

    const { container } = render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    const root = container.querySelector('div.relative');
    expect(root.className).not.toContain('animate-pulse');

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(root.className).toContain('animate-pulse');

    jest.useRealTimers();
    isOverMock = false;
  });

  it('reparents node when dragged to new parent', async () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'A', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p2', type: 'task', content: 'B', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p3', type: 'task', content: 'C', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];

    const { container } = render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    await act(async () => {
      await dragHandler({ active: { id: 'p2' }, over: { id: 'p1' } });
    });

    await act(async () => {
      await dragHandler({ active: { id: 'p2' }, over: { id: 'p3' } });
    });

    const rootContainer = container.firstElementChild;
    const rootNodes = rootContainer.querySelectorAll(':scope > div.relative');
    expect(rootNodes.length).toBe(2);
    expect(within(rootContainer).getByText('C')).toBeInTheDocument();
  });

  it('removes edge when dropped outside any node', async () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'A', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p2', type: 'task', content: 'B', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];

    const { container } = render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    await act(async () => {
      await dragHandler({ active: { id: 'p2' }, over: { id: 'p1' } });
    });

    await act(async () => {
      await dragHandler({ active: { id: 'p2' }, over: null });
    });

    const rootContainer = container.firstElementChild;
    const rootNodes = rootContainer.querySelectorAll(':scope > div.relative');
    expect(rootNodes.length).toBe(2);
  });

  it('prevents cycles when dragging onto descendant', async () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'A', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p2', type: 'task', content: 'B', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p3', type: 'task', content: 'C', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];

    const { container } = render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    await act(async () => {
      await dragHandler({ active: { id: 'p2' }, over: { id: 'p1' } });
    });
    await act(async () => {
      await dragHandler({ active: { id: 'p3' }, over: { id: 'p2' } });
    });

    await act(async () => {
      await dragHandler({ active: { id: 'p1' }, over: { id: 'p3' } });
    });

    const rootContainer = container.firstElementChild;
    const rootNodes = rootContainer.querySelectorAll(':scope > div.relative');
    expect(rootNodes.length).toBe(1);
    const root = rootNodes[0];
    expect(within(root).getByText('A')).toBeInTheDocument();
    expect(within(root).getByText('B')).toBeInTheDocument();
    expect(within(root).getByText('C')).toBeInTheDocument();
  });
});
