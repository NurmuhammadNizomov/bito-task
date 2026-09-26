import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError(403, 'Insufficient permissions', 'error.forbidden'));
      return;
    }
    next();
  };
}
