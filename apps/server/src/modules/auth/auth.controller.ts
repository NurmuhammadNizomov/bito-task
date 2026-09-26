import { Request, Response } from 'express';
import * as authService from './auth.service';
import { asyncHandler } from '../../common/utils/async-handler';
import { StatusCodes } from 'http-status-codes';
import { ok } from '../../common/utils/api-response';
import { REFRESH_TTL_MS } from '../../config/env';

// Cross-site refresh on render (HTTPS, different subdomains) needs SameSite=None+Secure;
// localhost is same-site so Lax over http works.
const isProd = process.env.NODE_ENV === 'production';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/api/v1/auth',
  maxAge: REFRESH_TTL_MS,
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(
    req.body,
    req.headers['user-agent'] || '',
    req.ip || '',
  );
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
  ok(res, { accessToken: result.accessToken, user: result.user }, 'auth.loginSuccess');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ success: false, messageKey: 'error.unauthorized', message: 'No refresh token' });
    return;
  }
  const result = await authService.refresh(
    token,
    req.headers['user-agent'] || '',
    req.ip || '',
  );
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
  ok(res, { accessToken: result.accessToken, user: result.user }, 'auth.refreshSuccess');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await authService.logout(token);
  }
  res.clearCookie('refreshToken', {
    path: '/api/v1/auth',
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  });
  ok(res, undefined, 'auth.logoutSuccess');
});
