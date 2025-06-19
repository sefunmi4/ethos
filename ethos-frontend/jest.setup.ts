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

// ReactMarkdown is ESM-only; mock to avoid transform issues in Jest
jest.mock('react-markdown', () => ({ __esModule: true, default: () => null }));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => null }));
