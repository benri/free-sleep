import { Request, Response, NextFunction } from 'express';
import { Role } from './authSchema.js';

type AuthenticatedRequest = Request & { user?: { userId: number; username: string; role: string } };

export default function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role as Role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}
