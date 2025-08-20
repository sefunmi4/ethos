export default {
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json', useESM: true, diagnostics: false }],
    '^.+\\.mjs$': ['ts-jest', { tsconfig: 'tsconfig.test.json', useESM: true, diagnostics: false }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-force-graph-2d|react-force-graph|three|force-graph)(/|$))'
  ],
  moduleNameMapper: {
    'react-markdown': '<rootDir>/tests/__mocks__/react-markdown.tsx',
    'remark-gfm': '<rootDir>/tests/__mocks__/remark-gfm.ts',
    '.*/hooks/usePermissions$': '<rootDir>/tests/__mocks__/usePermissions.ts',
    '.*/hooks/useGit$': '<rootDir>/tests/__mocks__/useGit.ts',
    'react-force-graph-2d': '<rootDir>/tests/__mocks__/react-force-graph-2d.tsx',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
  },
  testMatch: [
    '<rootDir>/src/api/quest.test.ts',
    '<rootDir>/src/components/controls/LinkControls.test.tsx',
    '<rootDir>/src/components/controls/ReactionControls.repost.test.tsx',
    '<rootDir>/src/components/controls/ReactionControls.reviewRequest.test.tsx',
    '<rootDir>/src/components/post/PostCard.requestHelp.test.tsx',
    '<rootDir>/src/components/post/PostListItem.test.tsx',
    '<rootDir>/src/components/post/PostCard.moveToTask.test.tsx',
    '<rootDir>/src/api/post.requestHelp.test.ts',
    '<rootDir>/tests/CreatePostReplyTypeRestrictions.test.tsx',
    '<rootDir>/tests/CreatePostReply.test.tsx',
    '<rootDir>/tests/CreatePostRequestNoTask.test.tsx',
    '<rootDir>/tests/BoardUtilsRequestPosts.test.ts',
    '<rootDir>/tests/PostTypeFilterOptions.test.tsx',
    '<rootDir>/tests/ThemeProvider.test.js',
    '<rootDir>/tests/TimelineBoardPostTypes.test.tsx'
    ,'<rootDir>/src/components/controls/ReactionControls.permission.test.tsx'
    ,'<rootDir>/src/components/ui/SummaryTag.theme.test.tsx'
    ,'<rootDir>/tests/AcceptRequestButton.test.tsx'
    ,'<rootDir>/tests/NotificationsPage.test.tsx'
    ,'<rootDir>/tests/PostCardCTA.test.tsx'
    ,'<rootDir>/tests/QuestBoardRequestPostTypes.test.tsx'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      useESM: true,
      diagnostics: false,
    }
  }
};
