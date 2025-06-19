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
