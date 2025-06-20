import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '../src/components/post/PostCard';

jest.mock('../src/api/post', () => ({
  __esModule: true,
  fetchRepliesByPostId: jest.fn(() => Promise.resolve([])),
  updatePost: jest.fn((id, data) => Promise.resolve({ id, ...data })),
  fetchPostsByQuestId: jest.fn(() => Promise.resolve([])),
  fetchReactions: jest.fn(() => Promise.resolve([])),
  fetchRepostCount: jest.fn(() => Promise.resolve({ count: 0 })),
  fetchUserRepost: jest.fn(() => Promise.resolve(null)),
  addRepost: jest.fn(() => Promise.resolve({ id: 'r1' })),
  removeRepost: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/api/quest', () => ({
  __esModule: true,
  linkPostToQuest: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../src/hooks/useGraph', () => ({
  __esModule: true,
  useGraph: () => ({ loadGraph: jest.fn() }),
}));

jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({
    selectedBoard: 'b1',
    updateBoardItem: jest.fn(),
    boards: { b1: { boardType: 'post' } },
  }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

jest.mock(
  'react-markdown',
  () => {
    return function Mock({ children, components }) {
      const lines = String(children).split(/\n/);
      return (
        <div>
          {lines.map((line, idx) => {
            const m = line.match(/- \[( |x)\] (.*)/);
            if (m) {
              const Input = components?.input || 'input';
              return (
                <label key={idx}>
                  <Input type="checkbox" checked={m[1] === 'x'} />
                  {m[2]}
                </label>
              );
            }
            return <span key={idx}>{line}</span>;
          })}
        </div>
      );
    };
  },
  { virtual: true }
);

jest.mock('remark-gfm', () => () => ({}), { virtual: true });

const { updatePost } = require('../src/api/post');

describe('task list checkbox', () => {
  it('toggles checkbox and updates post', async () => {
    const post = {
      id: 'p1',
      authorId: 'u1',
      type: 'task',
      content: '- [ ] task one\n- [x] task two',
      visibility: 'public',
      timestamp: '',
      tags: [],
      collaborators: [],
      linkedItems: [],
    } as any;

    function Wrapper() {
      const [p, setP] = React.useState(post);
      return <PostCard post={p} user={{ id: 'u1' }} onUpdate={setP} />;
    }

    render(
      <BrowserRouter>
        <Wrapper />
      </BrowserRouter>
    );
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes[0]).not.toBeChecked();

    fireEvent.change(boxes[0], { target: { checked: true } });
    await waitFor(() => expect(updatePost).toHaveBeenCalled());
    expect(updatePost).toHaveBeenCalledWith('p1', {
      content: '- [x] task one\n- [x] task two',
    });
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
  });
});
