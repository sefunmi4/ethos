// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/express';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.get('authorization'); //todp: Cannot invoke an object which is possibly 'undefined'.t
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded; //TODO:  ype 'string | JwtPayload' is not assignable to type '{ id: string; role?: string | undefin
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden' });
  }
};