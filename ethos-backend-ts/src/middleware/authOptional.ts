// middleware/authOptional.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'your-secret';

// Extend Request to support user field
export interface OptionalAuthRequest extends Request {
  user?: string | JwtPayload | null;
}

const authOptional = (
  req: OptionalAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  let token: string | null = null;

  // Prefer cookie if available
  if (req.cookies?.refreshToken) {
    token = req.cookies.refreshToken;
  }
  // Fallback to Authorization header
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET);
      req.user = decoded;
    } catch {
      req.user = null; // invalid token
    }
  } else {
    req.user = null; // no token
  }

  next();
};

export default authOptional;