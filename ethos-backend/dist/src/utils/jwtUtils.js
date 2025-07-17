"use strict";
// src/utils/jwtUtils.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error('Missing JWT secrets in environment variables');
}
/**
 * Generates an access token (expires in 1 hour)
 */
const generateAccessToken = (payload) => {
    const options = { expiresIn: '1h' };
    return jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, options);
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generates a refresh token (expires in 7 days)
 */
const signRefreshToken = (payload) => {
    const options = { expiresIn: '7d' };
    return jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, options);
};
exports.signRefreshToken = signRefreshToken;
/**
 * Verifies a JWT using the access token secret
 */
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Verifies a JWT using the refresh token secret
 */
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
