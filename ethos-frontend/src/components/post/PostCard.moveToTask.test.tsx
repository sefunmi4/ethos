import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';

const updatePostMock = jest.fn((id, data) => Promise.resolve({ id, ...data }));
const updateBoardItemMock = jest.fn();

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  updatePost: (...args: any[]) => updatePostMock(...args),
  removeHelpRequest: jest.fn(() => Promise.resolve({ success: true })),
  createJoinRequest: jest.fn(() => Promise.resolve({})),
  updateReaction: jest.fn(() => Promise.resolve()),
  addRepost: jest.fn(() => Promise.resolve({ id: 'r1' })),
  removeRepost: jest.fn(() => Promise.resolve()),
  fetchReactions: jest.fn(() => Promise.resolve([])),
  fetchRepostCount: jest.fn(() => Promise.resolve({ count: 0 })),
  fetchUserRepost: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../ui/TaskLinkDropdown', () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <div data-testid="task-picker">
      <button onClick={() => onSelect('t1')}>Task1</button>
    </div>
  ),
}));

jest.mock('../../api/auth', () => ({
  __esModule: true,
  fetchUserById: jest.fn(() => Promise.resolve({ id: 'u1', username: 'alice' })),
}));

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ selectedBoard: 'b1', updateBoardItem: updateBoardItemMock }),
}));

jest.mock('../../hooks/useGraph', () => ({
  useGraph: () => ({ loadGraph: jest.fn() }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe('PostCard Move to Task', () => {
  it('updates linkedItems when moving file post to task', async () => {
    const post: Post = {
      id: 'f1',
      authorId: 'u1',
      type: 'file',
      content: 'file',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
    } as unknown as Post;

    render(
      <BrowserRouter>
        <PostCard post={post} user={{ id: 'u1' } as any} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/Move to Task/i));
    fireEvent.click(screen.getByText('Task1'));

    await waitFor(() =>
      expect(updatePostMock).toHaveBeenCalledWith(
        'f1',
        expect.objectContaining({
          linkedItems: [
            { itemId: 't1', itemType: 'post', linkType: 'task_edge', nodeId: '' },
          ],
        })
      )
    );
    expect(updateBoardItemMock).toHaveBeenCalled();
  });
});

