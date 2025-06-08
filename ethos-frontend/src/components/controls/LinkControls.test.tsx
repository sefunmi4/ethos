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
});
