import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.ACCESS_SECRET, { expiresIn: '1h' });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: '7d' });