import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContributionCard from '../src/components/contribution/ContributionCard';
import type { Quest } from '../src/types/questTypes';

const quest: Quest = {
  id: 'q1',
  authorId: 'u1',
  title: 'Timeline Quest',
  visibility: 'public',
  approvalStatus: 'approved',
  status: 'active',
  headPostId: 'p1',
  linkedPosts: [],
  collaborators: [],
  gitRepo: { repoId: '', repoUrl: '' },
};

describe('Timeline quest formatting', () => {
  it('renders quest using QuestCard formatting on timeline board', () => {
    render(
      <BrowserRouter>
        <ContributionCard contribution={quest} boardId="timeline-board" />
      </BrowserRouter>
    );
    expect(screen.getByText('Timeline Quest')).toBeInTheDocument();
    expect(screen.getByText('Quest')).toBeInTheDocument();
  });
});
