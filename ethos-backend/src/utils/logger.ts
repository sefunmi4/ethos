import { RequestHandler } from 'express';

/**
 * Logging levels mapped to a numeric severity.
 */
const levels = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type LogLevel = keyof typeof levels;

/**
 * Current log level read from the environment.
 * Defaults to 'info' if not provided.
 */
const currentLevel: number =
  levels[(process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || 'info'];

/**
 * Centralized logging function that prefixes output with level and timestamp.
 */
const log = (level: LogLevel, ...args: unknown[]): void => {
  if (levels[level] <= currentLevel) {
    const timestamp = new Date().toISOString();
    const output =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    output(`[${level.toUpperCase()}] [${timestamp}]`, ...args);
  }
};

export const info = (...args: unknown[]): void => log('info', ...args);
export const warn = (...args: unknown[]): void => log('warn', ...args);
export const error = (...args: unknown[]): void => log('error', ...args);
export const debug = (...args: unknown[]): void => log('debug', ...args);

/**
 * Express middleware that logs the incoming request method and URL.
 */
export const requestLogger: RequestHandler = (req, _res, next) => {
  info(`${req.method} ${req.originalUrl}`);
  next();
};
