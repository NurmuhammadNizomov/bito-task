import { Request, Response, NextFunction } from 'express';
import { logger } from '../common/utils/logger';

const STATUS_MESSAGE_KEY_MAP: Record<number, string> = {
  400: 'error.validation',
  401: 'error.unauthorized',
  403: 'error.forbidden',
  404: 'error.notFound',
  409: 'error.stock',
  422: 'error.validation',
  429: 'error.generic',
  500: 'error.generic',
};

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public messageKey?: string,
  ) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal Server Error';
  const messageKey = err instanceof AppError && err.messageKey
    ? err.messageKey
    : STATUS_MESSAGE_KEY_MAP[statusCode] || 'error.generic';

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl}`, { error: err });
  }

  res.status(statusCode).json({
    success: false,
    message,
    messageKey,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
  });
}
