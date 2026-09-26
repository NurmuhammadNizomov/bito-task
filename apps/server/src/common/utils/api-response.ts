import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: ApiMeta;
  messageKey?: string;
  timestamp: string;
  method: string;
  path: string;
}

function build<T>(res: Response, statusCode: number, payload: {
  data?: T;
  meta?: ApiMeta;
  messageKey?: string;
}): void {
  const body: ApiResponse<T> = {
    success: statusCode < 400,
    timestamp: new Date().toISOString(),
    method: res.req.method,
    path: res.req.originalUrl,
  };
  if (payload.data !== undefined) body.data = payload.data;
  if (payload.meta) body.meta = payload.meta;
  if (payload.messageKey) body.messageKey = payload.messageKey;
  res.status(statusCode).json(body);
}

export function ok<T>(res: Response, data?: T, messageKey?: string) {
  return build(res, StatusCodes.OK, { data, messageKey });
}

export function created<T>(res: Response, data?: T, messageKey?: string) {
  return build(res, StatusCodes.CREATED, { data, messageKey });
}

export function paginated<T>(
  res: Response,
  data: T[],
  meta: { page: number; limit: number; total: number },
  messageKey?: string,
) {
  return build(res, StatusCodes.OK, {
    data,
    meta: { ...meta, totalPages: Math.ceil(meta.total / meta.limit) },
    messageKey,
  });
}

export function accepted<T>(res: Response, data?: T, messageKey?: string) {
  return build(res, StatusCodes.ACCEPTED, { data, messageKey });
}
