import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import * as userRepo from '../users/user.repository';
import { RefreshToken } from './refresh-token.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt';
import { AppError } from '../../middleware/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../common/utils/logger';
import { REFRESH_TTL_MS } from '../../config/env';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function login(
  data: { email: string; password: string },
  userAgent: string,
  ipAddress: string,
) {
  const user = await userRepo.findByEmail(data.email);
  if (!user) {
    logger.warn('Failed login: user not found', { email: data.email, ip: ipAddress });
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    logger.warn('Failed login: wrong password', { userId: user._id, ip: ipAddress });
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const payload = { userId: user._id.toString(), role: user.role, tenantId: user.tenantId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  await userRepo.updateLastLogin(user._id.toString());
  logger.info('User logged in', { userId: user._id, ip: ipAddress });

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
  };
}

export async function refresh(rawToken: string, userAgent: string, ipAddress: string) {
  const tokenHash = hashToken(rawToken);
  const session = await RefreshToken.findOne({ tokenHash });

  if (!session) {
    logger.warn('Refresh: no session found', { ip: ipAddress });
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  if (session.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: session._id });
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Refresh token expired');
  }

  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    await RefreshToken.deleteOne({ _id: session._id });
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  // Theft detection: if findOne({ tokenHash }) above returned a session, the token is valid.
  // A rotated (consumed) token is deleted from DB, so findOne would return null → 401.
  // No "latest session" comparison needed — that approach breaks multi-device sessions.
  await RefreshToken.deleteOne({ _id: session._id });

  const user = await userRepo.findById(payload.userId);
  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const newPayload = { userId: payload.userId, role: payload.role, tenantId: payload.tenantId };
  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  await RefreshToken.create({
    userId: session.userId,
    tokenHash: hashToken(newRefreshToken),
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  logger.info('Refresh token rotated', { userId: session.userId });
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: { id: user._id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
  };
}

export async function logout(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.deleteOne({ tokenHash });
  logger.info('User logged out');
}
