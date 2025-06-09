import { render, screen, waitFor } from '@testing-library/react';
import LinkControls from './LinkControls';

jest.mock('../../api/post', () => ({
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

describe('LinkControls', () => {
  it('shows free speech posts in options', async () => {
    render(<LinkControls value={[]} onChange={() => {}} itemTypes={['post']} />);
    await waitFor(() => {
      expect(screen.getByText(/hello world/)).toBeInTheDocument();
    });
  });

  it('includes task_edge link type option', () => {
    const linked = [
      {
        itemId: 'p1',
        itemType: 'post',
        nodeId: '',
        linkType: 'task_edge',
        linkStatus: 'active',
      },
    ];

    render(<LinkControls value={linked} onChange={() => {}} itemTypes={['post']} />);

    expect(
      screen.getByText(/Link to parent \/ mark as sub-problem/)
    ).toBeInTheDocument();
  });
});
