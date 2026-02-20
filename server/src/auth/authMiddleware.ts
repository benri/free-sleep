import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './authService.js';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for non-API routes (static files, SPA)
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Skip auth for login and health check
  if (req.path === '/api/auth/login' || req.path === '/api/serverStatus') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    (req as Request & { user?: unknown }).user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
