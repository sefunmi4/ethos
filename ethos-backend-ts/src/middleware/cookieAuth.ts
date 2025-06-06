import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const cookieAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(403).json({ error: 'No token found in cookies' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET!);
    (req as any).user = decoded; // Extend `req` to include `user`
    return next(); // ✅ properly ends function with void return
  } catch (err) {
    console.error('[COOKIE AUTH ERROR]', err);
    res.status(403).json({ error: 'Invalid or expired token' });
    return; // ✅ ensures return type is void
  }
};