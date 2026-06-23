import type { JwtPayload } from '../common/types/auth.types';

// Augment Express Request so `req.user` is typed everywhere after `authenticate`.
declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
      // Raw request bytes captured for webhook HMAC verification.
      rawBody?: string;
    }
  }
}

export {};
