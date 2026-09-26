import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../common/utils/jwt';
import { AppError } from './error.middleware';
import * as userRepo from '../modules/users/user.repository';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'Access token required', 'error.unauthorized'));
    return;
  }

  const token = header.replace('Bearer ', '');
  try {
    const payload = verifyAccessToken(token);

    // A valid signature is not enough: confirm the user still exists in the DB by
    // the token's userId, is active, and its tenant claim still matches the record.
    // This stops a token for a deleted/disabled account or a stale tenant from working.
    const user = await userRepo.findById(payload.userId);
    if (!user || !user.isActive || user.tenantId !== payload.tenantId) {
      next(new AppError(401, 'Invalid or expired access token', 'error.unauthorized'));
      return;
    }

    req.user = payload;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired access token', 'error.unauthorized'));
  }
}
