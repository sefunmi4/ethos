import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

const updatePostMock = jest.fn(
  (id: string, data: Partial<Post>) => Promise.resolve({ id, ...data })
);
const updateBoardItemMock = jest.fn();

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  updatePost: (
    ...args: Parameters<typeof updatePostMock>
  ) => updatePostMock(...args),
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

describe('PostCard Add to Folder', () => {
  it('updates linkedItems when using Add to Folder option', async () => {
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

    const user: User = {
      id: 'u1',
      email: 'test@example.com',
      username: 'alice',
      password: '',
      role: 'user',
      bio: '',
      tags: [],
      links: {},
      experienceTimeline: [],
    };

    render(
      <BrowserRouter>
        <PostCard post={post} user={user} />
      </BrowserRouter>
    );

    expect(screen.queryByText(/Move to Task/i)).toBeNull();

    fireEvent.click(screen.getByLabelText(/More options/i));
    fireEvent.click(screen.getByText(/Add to Folder/i));
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

