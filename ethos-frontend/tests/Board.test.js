const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
const Board = require('../src/components/board/Board').default;

jest.mock('../src/api/board', () => ({
  fetchBoard: jest.fn(),
  fetchBoardItems: jest.fn(),
}));

jest.mock('../src/hooks/usePermissions', () => ({
  usePermissions: () => ({ canEditBoard: () => false }),
}));

jest.mock('../src/hooks/useSocket', () => ({
  useSocketListener: jest.fn(),
}));

jest.mock('../src/contexts/BoardContext', () => ({
  useBoardContext: () => ({
    setSelectedBoard: jest.fn(),
    appendToBoard: jest.fn(),
  }),
}));

const { fetchBoard, fetchBoardItems } = require('../src/api/board');

describe('Board layout logic', () => {
  it('falls back to grid when posts from other quests exist', async () => {
    fetchBoard.mockResolvedValue({
      id: 'b1',
      title: 'Board',
      layout: 'graph',
      items: [],
      createdAt: new Date().toISOString(),
      enrichedItems: [],
    });

    const quest = {
      id: 'q1',
      headPostId: 'p1',
      title: 'Quest',
      status: 'active',
      linkedPosts: [],
      collaborators: [],
      authorId: 'u1',
    };

    const items = [
      quest,
      { id: 'p2', type: 'post', questId: 'q1', createdAt: '', content: '', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p3', type: 'post', questId: 'q2', createdAt: '', content: '', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
    ];

    fetchBoardItems.mockResolvedValue(items);

    render(React.createElement(Board, { boardId: 'b1', user: { id: 'u1' }, showCreate: false }));

    await waitFor(() => {
      expect(screen.queryByText('Loading board...')).not.toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const layoutSelect = selects[2];
    expect(layoutSelect.value).toBe('grid');
    expect(screen.queryByText('Graph')).toBeNull();
  });
});
