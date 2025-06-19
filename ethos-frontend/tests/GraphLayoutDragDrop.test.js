const React = require('react');
const { render, act, within } = require('@testing-library/react');
const GraphLayout = require('../src/components/layout/GraphLayout').default;

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
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
}), { virtual: true });

jest.mock('../src/hooks/useGit', () => ({
  useGitDiff: () => ({ data: null, isLoading: false })
}));

jest.mock('../src/api/quest', () => ({
  linkPostToQuest: jest.fn(() => Promise.resolve({}))
}));

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

    const rootNodes = container.querySelectorAll(':scope > div.relative');
    expect(rootNodes.length).toBe(1);
    const root = rootNodes[0];
    expect(within(root).getByText('Parent')).toBeInTheDocument();
    expect(within(root).getByText('Child')).toBeInTheDocument();
  });
});
