import { act, render, screen, waitFor } from '@testing-library/react';
import LinkControls from './LinkControls';
import type { LinkedItem } from '../../types/postTypes';

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchAllPosts: jest.fn(() =>
    Promise.resolve([
      {
        id: 'p1',
        authorId: 'u1',
        type: 'free_speech',
        content: 'hello world',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
      },
    ])
  ),
}));

jest.mock('../../api/quest', () => ({
  fetchAllQuests: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../api/project', () => ({
  fetchAllProjects: jest.fn(() => Promise.resolve([])),
}));

describe('LinkControls', () => {
  it('shows free speech posts in options', async () => {
    await act(async () => {
      render(<LinkControls value={[]} onChange={() => {}} itemTypes={['post']} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/hello world/)).toBeInTheDocument();
    });
  });

  it('includes task_edge link type option', async () => {
    const linked: LinkedItem[] = [
      {
        itemId: 'p1',
        itemType: 'post',
        nodeId: '',
        linkType: 'task_edge',
        linkStatus: 'active',
      },
    ];

    await act(async () => {
      render(<LinkControls value={linked} onChange={() => {}} itemTypes={['post']} />);
    });

    expect(
      screen.getByText(/Link to parent \/ mark as sub-problem/)
    ).toBeInTheDocument();
  });
});
