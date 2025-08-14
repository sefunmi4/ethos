import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContributionCard from '../src/components/contribution/ContributionCard';
import type { EnrichedPost } from '../src/types/postTypes';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('../src/api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  fetchReactions: jest.fn(() => Promise.resolve([])),
  fetchRepostCount: jest.fn(() => Promise.resolve({ count: 0 })),
  fetchUserRepost: jest.fn(() => Promise.resolve(null)),
  updateReaction: jest.fn(() => Promise.resolve()),
  addRepost: jest.fn(() => Promise.resolve({ id: 'r1' })),
  removeRepost: jest.fn(() => Promise.resolve()),
}));

const requestPost: EnrichedPost = {
  id: 'r1',
  authorId: 'u1',
  type: 'task',
  content: 'Need help',
  visibility: 'public',
  timestamp: '',
  tags: ['request'],
  collaborators: [],
  linkedItems: [],
  author: { id: 'u1', username: 'u1' },
  enrichedCollaborators: [],
};

describe('Request post rendering', () => {
  it('uses RequestCard on quest board', () => {
    render(
      <BrowserRouter>
        <ContributionCard contribution={requestPost} boardId="quest-board" />
      </BrowserRouter>
    );
    expect(screen.getByText('Need help')).toBeInTheDocument();
    expect(screen.getByText(/Accept/i)).toBeInTheDocument();
  });
});
