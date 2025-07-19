import '@testing-library/jest-dom';

// Polyfill TextEncoder and TextDecoder for testing environment
import { TextEncoder, TextDecoder } from 'util';

// @ts-expect-error polyfill for tests
if (typeof global.TextEncoder === 'undefined') {
  // @ts-expect-error polyfill for tests
  global.TextEncoder = TextEncoder;
}
// @ts-expect-error polyfill for tests
if (typeof global.TextDecoder === 'undefined') {
  // @ts-expect-error polyfill for tests
  global.TextDecoder = TextDecoder;
}

// Provide a default API base for modules that read from import.meta.env
process.env.VITE_API_URL = 'http://localhost:4173/api';


