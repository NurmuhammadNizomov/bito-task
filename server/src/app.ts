import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { routes } from './routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './common/utils/logger';

export const app = express();

// Behind Render's TLS-terminating proxy: trust X-Forwarded-* so req.secure is
// true over HTTPS (required for Secure cookies) and req.ip is the real client IP.
app.set('trust proxy', 1);

// Webhook raw body capture — must be first
app.use('/api/v1/webhooks', express.json({ verify: (req: Request, _res: Response, buf: Buffer) => { req.rawBody = buf.toString(); } }));
app.use('/api/v1/webhooks', express.urlencoded({ extended: true, verify: (req: Request, _res: Response, buf: Buffer) => { req.rawBody = buf.toString(); } }));

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(compression());
app.use(morgan('dev', { stream: { write: (msg: string) => logger.info(msg.trim()) } }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

app.use(errorHandler);
