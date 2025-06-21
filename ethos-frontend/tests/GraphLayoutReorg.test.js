import React from 'react';
import { render, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../src/hooks/useGit', () => ({
  __esModule: true,
  useGitDiff: () => ({ data: null, isLoading: false })
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

import GraphLayout from '../src/components/layout/GraphLayout';

describe.skip('GraphLayout task graph reorg', () => {
  it('nests child tasks when edges define hierarchy', () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'Parent', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p2', type: 'task', content: 'Child', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];
    const edges = [{ from: 'p1', to: 'p2' }];

    const { container } = render(
      React.createElement(BrowserRouter, null,
        React.createElement(GraphLayout, { items: posts, edges, questId: 'q1' })
      )
    );
    const rootNodes = container.querySelectorAll(':scope > div.relative');
    expect(rootNodes.length).toBe(1);
    const root = rootNodes[0];
    expect(within(root).getByText('Parent')).toBeInTheDocument();
    expect(within(root).getByText('Child')).toBeInTheDocument();
  });
});
