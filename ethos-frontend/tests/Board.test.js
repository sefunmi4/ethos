import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Board from '../src/components/board/Board';

jest.mock('../src/api/board', () => ({
  __esModule: true,
  fetchBoard: jest.fn(),
  fetchBoardItems: jest.fn(),
}));

jest.mock('../src/hooks/usePermissions', () => ({
  __esModule: true,
  usePermissions: () => ({ canEditBoard: () => false }),
}));

jest.mock('../src/hooks/useSocket', () => ({
  __esModule: true,
  useSocketListener: jest.fn(),
}));

jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({
    setSelectedBoard: jest.fn(),
    appendToBoard: jest.fn(),
    updateBoardItem: jest.fn(),
    boards: {},
  }),
}));

import { fetchBoard, fetchBoardItems } from '../src/api/board';

  describe.skip('Board layout logic', () => {
    it('falls back to grid when posts from other quests exist', async () => {
    fetchBoard.mockResolvedValue({
      id: 'b1',
      title: 'Board',
      boardType: 'post',
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

    render(
      React.createElement(BrowserRouter, null,
        React.createElement(Board, { boardId: 'b1', user: { id: 'u1' }, showCreate: false })
      )
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading board...')).not.toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const layoutSelect = selects[2];
    expect(layoutSelect.value).toBe('grid');
      expect(screen.queryByText('Graph')).toBeNull();
    });

    it('renders map view when a single quest is attached', async () => {
      fetchBoard.mockResolvedValue({
        id: 'b1',
        title: 'Board',
        boardType: 'quest',
        layout: 'graph',
        questId: 'q1',
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
        {
          id: 'p2',
          type: 'post',
          questId: 'q1',
          createdAt: '',
          content: '',
          authorId: 'u1',
          visibility: 'public',
          timestamp: '',
          tags: [],
          collaborators: [],
          linkedItems: [],
        },
      ];

      fetchBoardItems.mockResolvedValue(items);

      render(
        React.createElement(BrowserRouter, null,
          React.createElement(Board, { boardId: 'b1', user: { id: 'u1' }, showCreate: false })
        )
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading board...')).not.toBeInTheDocument();
      });

      const selects = screen.getAllByRole('combobox');
      const layoutSelect = selects[2];
      expect(layoutSelect.value).toBe('graph');
      expect(screen.getByText('Graph')).toBeInTheDocument();
    });

    it('renders no controls when there are zero items', async () => {
      fetchBoard.mockResolvedValue({
        id: 'b2',
        title: 'Board',
        boardType: 'post',
        layout: 'grid',
        items: [],
        createdAt: new Date().toISOString(),
        enrichedItems: [],
      });

      fetchBoardItems.mockResolvedValue([]);

      render(
        React.createElement(BrowserRouter, null,
          React.createElement(Board, { boardId: 'b2', user: { id: 'u1' }, showCreate: false })
        )
      );

      await waitFor(() => {
        expect(screen.queryByText('Board not found.')).not.toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('Filter...')).toBeNull();
    });
  });
