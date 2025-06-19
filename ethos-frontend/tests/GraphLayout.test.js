const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const GraphLayout = require('../src/components/layout/GraphLayout').default;

jest.mock('../src/hooks/useGit', () => ({
  useGitDiff: jest.fn(() => ({ data: { diffMarkdown: 'diff' }, isLoading: false }))
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

const { useGitDiff } = require('../src/hooks/useGit');

describe('GraphLayout node interaction', () => {
  it('loads git diff and dispatches event on node click', async () => {
    const posts = [
      {
        id: 'p1',
        type: 'task',
        content: 'Task',
        authorId: 'u1',
        visibility: 'public',
        timestamp: '',
        tags: [],
        collaborators: [],
        linkedItems: [],
        gitFilePath: 'file.js',
        gitCommitSha: 'abc'
      }
    ];

    const listener = jest.fn();
    window.addEventListener('questTaskSelect', listener);

    render(React.createElement(GraphLayout, { items: posts, questId: 'q1' }));

    fireEvent.click(screen.getByText('Task'));

    await waitFor(() => {
      expect(useGitDiff).toHaveBeenCalledWith({
        questId: 'q1',
        filePath: 'file.js',
        commitId: 'abc'
      });
    });

    expect(listener).toHaveBeenCalled();
    expect(screen.getByText('diff')).toBeInTheDocument();
  });
});
