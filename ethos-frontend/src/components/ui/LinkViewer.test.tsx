import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LinkViewer from './LinkViewer';
import type { LinkedItem, Post } from '../../types/postTypes';

jest.mock('../../api/quest', () => ({
  __esModule: true,
  fetchQuestById: jest.fn(() => Promise.resolve({ title: 'Quest' })),
}));

jest.mock('../../api/post', () => ({
  __esModule: true,
  fetchPostById: jest.fn((id: string) => {
    const chain: Record<string, Post> = {
      p2: {
        id: 'p2',
        authorId: 'u1',
        type: 'task',
        content: 'parent',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
        replyTo: 'p1',
        questId: 'q1',
        nodeId: 'T02',
      } as unknown as Post,
      p1: {
        id: 'p1',
        authorId: 'u1',
        type: 'task',
        content: 'root',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
        replyTo: null,
        questId: 'q1',
        nodeId: 'T01',
      } as unknown as Post,
    };
    return Promise.resolve(chain[id]);
  }),
}));

describe('LinkViewer', () => {
  const items: LinkedItem[] = [
    { itemId: 'q1', itemType: 'quest', linkType: 'related' },
  ];

  const post: Post = {
    id: 'p3',
    authorId: 'u1',
    type: 'task',
    content: 'child',
    visibility: 'public',
    timestamp: '',
    tags: [],
    collaborators: [],
    linkedItems: items,
    replyTo: 'p2',
    questId: 'q1',
    nodeId: 'T03',
  } as unknown as Post;

  it('toggles label text', () => {
    render(<LinkViewer items={items} />);
    const btn = screen.getByText('View Links');
    fireEvent.click(btn);
    expect(screen.getByText('Hide Links')).toBeInTheDocument();
  });

  it('shows reply chain when enabled', async () => {
    render(<LinkViewer items={[]} post={post} showReplyChain />);
    fireEvent.click(screen.getByText('View Links'));
    await waitFor(() => {
      expect(screen.getByText('Q:T02')).toBeInTheDocument();
      expect(screen.getByText('Q:T01')).toBeInTheDocument();
      expect(screen.getAllByText('@u1')[0]).toBeInTheDocument();
    });
  });
});
