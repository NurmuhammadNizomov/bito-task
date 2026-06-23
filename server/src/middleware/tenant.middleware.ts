import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../common/utils/logger';
import { Tenant } from '../modules/tenant/tenant.model';

export async function requireTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || !req.user.tenantId) {
    logger.warn('Request with missing or unknown tenant', { url: req.originalUrl });
    next(new AppError(StatusCodes.FORBIDDEN, 'Unknown tenant', 'error.forbidden'));
    return;
  }

  try {
    // Confirm the tenant claim resolves to a real, active Tenant by its id —
    // a token referencing a deleted/disabled tenant is rejected.
    const tenant = await Tenant.findById(req.user.tenantId).lean();
    if (!tenant || !tenant.isActive) {
      logger.warn('Request with missing or unknown tenant', { url: req.originalUrl, tenantId: req.user.tenantId });
      next(new AppError(StatusCodes.FORBIDDEN, 'Unknown tenant', 'error.forbidden'));
      return;
    }
    next();
  } catch {
    next(new AppError(StatusCodes.FORBIDDEN, 'Unknown tenant', 'error.forbidden'));
  }
}
