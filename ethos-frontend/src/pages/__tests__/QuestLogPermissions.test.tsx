import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import QuestPage from '../quest/[id]';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'viewer' } })
}));

jest.mock('../../hooks/useQuest', () => ({
  useQuest: () => ({
    quest: {
      id: 'q1',
      authorId: 'owner',
      title: 'Quest',
      headPostId: '',
      status: 'active',
      linkedPosts: [],
      collaborators: []
    },
    error: null,
    isLoading: false
  })
}));

jest.mock('../../hooks/useBoard', () => ({
  useBoard: () => ({
    board: {
      id: 'log-q1',
      title: 'Log',
      layout: 'grid',
      items: [],
      enrichedItems: [],
      createdAt: ''
    },
    refresh: jest.fn(),
    isLoading: false
  })
}));

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({
    refreshBoards: jest.fn(),
    boards: {},
    setSelectedBoard: jest.fn(),
  }),
}));

jest.mock('../../hooks/useSocket', () => ({
  useSocketListener: jest.fn()
}));

jest.mock('../../api/board', () => ({
  addBoard: jest.fn()
}));

describe.skip('QuestLog permissions', () => {
  it('hides editing controls for unauthorized users', async () => {
    render(
      <BrowserRouter>
        <QuestPage />
      </BrowserRouter>
    );
    await waitFor(() =>
      expect(screen.getByText('📜 Quest Log')).toBeInTheDocument()
    );
    expect(screen.queryByText('✏️ Edit Board')).toBeNull();
  });
});
