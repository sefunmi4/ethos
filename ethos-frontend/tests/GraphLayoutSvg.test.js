const React = require('react');
const { render } = require('@testing-library/react');
const GraphLayout = require('../src/components/layout/GraphLayout').default;

jest.mock('../src/hooks/useGit', () => ({
  __esModule: true,
  useGitDiff: () => ({ data: null, isLoading: false })
}));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('../src/components/layout/GraphNode', () => ({
  __esModule: true,
  default: ({ node, registerNode }) =>
    React.createElement('div', {
      'data-testid': node.id,
      ref: (el) => registerNode(node.id, el),
    }),
}), { virtual: true });

describe('GraphLayout edges svg', () => {
  it('renders a svg path when an edge exists', () => {
    const posts = [
      { id: 'p1', type: 'task', content: 'A', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] },
      { id: 'p2', type: 'task', content: 'B', authorId: 'u1', visibility: 'public', timestamp: '', tags: [], collaborators: [], linkedItems: [] }
    ];
    const edges = [{ from: 'p1', to: 'p2' }];

    const { container } = render(React.createElement(GraphLayout, { items: posts, edges, questId: 'q1' }));
    const svg = container.querySelector('svg');
    const path = container.querySelector('svg path');
    expect(svg).not.toBeNull();
    expect(path).not.toBeNull();
  });
});
