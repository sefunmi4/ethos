import { RequestHandler } from 'express';

/**
 * Simple logging helpers for consistent server logs.
 */
export const info = (...args: unknown[]): void => {
  console.log('[INFO]', ...args);
};

export const warn = (...args: unknown[]): void => {
  console.warn('[WARN]', ...args);
};

export const error = (...args: unknown[]): void => {
  console.error('[ERROR]', ...args);
};

/**
 * Express middleware that logs the incoming request method and URL.
 */
export const requestLogger: RequestHandler = (req, _res, next) => {
  info(`${req.method} ${req.originalUrl}`);
  next();
};
