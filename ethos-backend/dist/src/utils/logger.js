"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.debug = exports.error = exports.warn = exports.info = void 0;
/**
 * Logging levels mapped to a numeric severity.
 */
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
/**
 * Current log level read from the environment.
 * Defaults to 'info' if not provided.
 */
const currentLevel = levels[process.env.LOG_LEVEL?.toLowerCase() || 'info'];
/**
 * Centralized logging function that prefixes output with level and timestamp.
 */
const log = (level, ...args) => {
    if (levels[level] <= currentLevel) {
        const timestamp = new Date().toISOString();
        const output = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
        output(`[${level.toUpperCase()}] [${timestamp}]`, ...args);
    }
};
const info = (...args) => log('info', ...args);
exports.info = info;
const warn = (...args) => log('warn', ...args);
exports.warn = warn;
const error = (...args) => log('error', ...args);
exports.error = error;
const debug = (...args) => log('debug', ...args);
exports.debug = debug;
/**
 * Express middleware that logs the incoming request method and URL.
 */
const requestLogger = (req, _res, next) => {
    (0, exports.info)(`${req.method} ${req.originalUrl}`);
    next();
};
exports.requestLogger = requestLogger;
