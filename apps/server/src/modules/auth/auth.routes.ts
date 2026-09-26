import { Router } from 'express';
import { login, refresh, logout } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema } from './auth.validation';
import { authenticate } from '../../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);

export default router;
