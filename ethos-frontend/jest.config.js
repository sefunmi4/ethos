export default {
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json', useESM: true, diagnostics: false }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-force-graph-2d|react-force-graph|three|force-graph)(/|$))'
  ],
  moduleNameMapper: {
    'react-markdown': '<rootDir>/tests/__mocks__/react-markdown.tsx',
    'remark-gfm': '<rootDir>/tests/__mocks__/remark-gfm.ts',
    '.*/hooks/usePermissions$': '<rootDir>/tests/__mocks__/usePermissions.ts',
    '.*/hooks/useGit$': '<rootDir>/tests/__mocks__/useGit.ts'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      useESM: true,
      diagnostics: false,
    }
  }
};
