// src/utils/jwtUtils.ts

import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('Missing JWT secrets in environment variables');
}

interface TokenPayload extends JwtPayload {
  id: string;
  [key: string]: any;
}

/**
 * Generates an access token (expires in 1 hour)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: '1h' };
  return jwt.sign(payload, ACCESS_SECRET, options);
};

/**
 * Generates a refresh token (expires in 7 days)
 */
export const signRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign(payload, REFRESH_SECRET, options);
};

/**
 * Verifies a JWT using the access token secret
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

/**
 * Verifies a JWT using the refresh token secret
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};