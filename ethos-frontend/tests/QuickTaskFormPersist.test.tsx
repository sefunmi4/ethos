import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskKanbanBoard from '../src/components/quest/TaskKanbanBoard';

jest.mock('../src/api/post', () => ({
  __esModule: true,
  fetchPostsByQuestId: jest.fn(),
  addPost: jest.fn(),
}));

jest.mock('../src/api/quest', () => ({
  __esModule: true,
  linkPostToQuest: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../src/contexts/BoardContext', () => ({
  __esModule: true,
  useBoardContext: () => ({ appendToBoard: jest.fn() }),
}));

import { fetchPostsByQuestId, addPost } from '../src/api/post';
import { linkPostToQuest } from '../src/api/quest';

describe('QuickTaskForm persistence', () => {
  it('keeps new subtask after reload', async () => {
    const newPost = {
      id: 't1',
      type: 'task',
      content: 'Sub',
      visibility: 'public',
      questId: 'q1',
      replyTo: 'n1',
    } as any;

    (fetchPostsByQuestId as jest.Mock).mockResolvedValueOnce([]);
    (addPost as jest.Mock).mockResolvedValueOnce(newPost);
    (fetchPostsByQuestId as jest.Mock).mockResolvedValueOnce([newPost]);

    const { rerender } = render(
      <TaskKanbanBoard questId="q1" linkedNodeId="n1" />,
    );

    fireEvent.click(screen.getByText('+ Add Task'));
    fireEvent.change(screen.getByPlaceholderText('Task name'), { target: { value: 'Sub' } });
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => expect(addPost).toHaveBeenCalled());
    expect(linkPostToQuest).toHaveBeenCalledWith('q1', { postId: 't1', parentId: 'n1' });
    expect(screen.getByText('Sub')).toBeInTheDocument();

    rerender(<TaskKanbanBoard questId="q1" linkedNodeId="n1" />);
    await waitFor(() => expect(fetchPostsByQuestId).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });
});
