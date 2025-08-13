import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostListItem from './PostListItem';
import type { PostWithQuestTitle } from '../../utils/displayUtils';
import { ROUTES } from '../../constants/routes';

const navMock = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => navMock,
  };
});

jest.mock('../../api/auth', () => ({
  __esModule: true,
  fetchUserById: jest.fn((id) => Promise.resolve({ id, username: 'alice' })),
}));

const basePost: PostWithQuestTitle = {
  id: 'p1',
  authorId: 'u1',
  type: 'free_speech',
  content: 'hello world',
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: [],
} as unknown as PostWithQuestTitle;

describe('PostListItem', () => {
  it('navigates to post page on click', async () => {
    render(
      <BrowserRouter>
        <PostListItem post={basePost} />
      </BrowserRouter>
    );

    await screen.findByText(/hello world/i);
    fireEvent.click(screen.getByText(/hello world/i));
    expect(navMock).toHaveBeenCalledWith(ROUTES.POST('p1'));
  });

  it('renders quest path tag for task posts', async () => {
    const taskPost: PostWithQuestTitle = {
      ...basePost,
      id: 't1',
      type: 'task',
      nodeId: 'Q:foo:T00',
      questId: 'q1',
    } as unknown as PostWithQuestTitle;

    render(
      <BrowserRouter>
        <PostListItem post={taskPost} />
      </BrowserRouter>
    );
    expect((await screen.findAllByText('Q::Task:T00')).length).toBeGreaterThan(0);
  });
});
