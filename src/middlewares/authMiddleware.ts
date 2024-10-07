import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validateToken } from '../auth';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader?.split(' ')[1];
  const isValidToken = validateToken(token as string);

  if(!isValidToken) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
  next();
};
