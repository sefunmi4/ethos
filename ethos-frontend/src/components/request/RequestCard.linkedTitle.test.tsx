import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RequestCard from './RequestCard';
import type { EnrichedPost } from '../../types/postTypes';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', xp: 0 } }),
}));

jest.mock('../../api/post', () => ({
  acceptRequest: jest.fn(),
  unacceptRequest: jest.fn(),
}));

describe('RequestCard linked title', () => {
  it('shows linked item title when post title missing', () => {
    const post: EnrichedPost = {
      id: 'p1',
      authorId: 'u2',
      type: 'task',
      content: 'content',
      visibility: 'public',
      timestamp: '',
      tags: ['request'],
      collaborators: [],
      linkedItems: [
        { itemId: 'p2', itemType: 'post', title: 'Linked Task' },
      ],
    } as EnrichedPost;
    render(
      <BrowserRouter>
        <RequestCard post={post} />
      </BrowserRouter>
    );
    expect(screen.getByText('Linked Task')).toBeInTheDocument();
  });
});
