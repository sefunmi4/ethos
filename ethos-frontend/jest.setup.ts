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
