import '@testing-library/jest-dom';

// Polyfill TextEncoder and TextDecoder for testing environment
import { TextEncoder, TextDecoder } from 'util';

// @ts-ignore
if (typeof global.TextEncoder === 'undefined') {
  // @ts-ignore
  global.TextEncoder = TextEncoder;
}
// @ts-ignore
if (typeof global.TextDecoder === 'undefined') {
  // @ts-ignore
  global.TextDecoder = TextDecoder;
}

// Provide a default API base for modules that read from import.meta.env
process.env.VITE_API_URL = 'http://localhost:3001/api';

// Mock ESM modules not handled by ts-jest
jest.mock('react-markdown', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('div', null, props.children),
  };
});
jest.mock('remark-gfm', () => ({}));
