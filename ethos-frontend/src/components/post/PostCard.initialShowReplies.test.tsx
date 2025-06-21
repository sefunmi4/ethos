import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import type { Post } from '../../types/postTypes';
import { fetchRepliesByPostId } from '../../api/post';

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({})
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

const mockReply: Post = {
  id: 'r1',
  authorId: 'u2',
  type: 'free_speech',
  content: 'Reply',
  visibility: 'public',
  timestamp: '',
  tags: [],
  collaborators: [],
  linkedItems: [],
  replyTo: 'p1'
} as any;

describe('PostCard initialShowReplies', () => {
  const basePost: Post = {
    id: 'p1',
    authorId: 'u1',
    type: 'free_speech',
    content: 'Post',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: [],
  } as any;

  it('loads and displays replies automatically', async () => {
    (fetchRepliesByPostId as jest.Mock).mockResolvedValue([mockReply]);
    render(
      <BrowserRouter>
        <PostCard post={basePost} initialShowReplies />
      </BrowserRouter>
    );

    await waitFor(() => expect(fetchRepliesByPostId).toHaveBeenCalled());
    expect(await screen.findByText('Reply')).toBeInTheDocument();
  });
});
