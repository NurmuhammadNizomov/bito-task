import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { routes } from './routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './common/utils/logger';

import path from 'path';
import fs from 'fs';

export const app = express();

// Behind Render/Vercel TLS-terminating proxy: trust X-Forwarded-*
app.set('trust proxy', 1);

// Webhook raw body capture — must be first
app.use('/api/v1/webhooks', express.json({ verify: (req: Request, _res: Response, buf: Buffer) => { req.rawBody = buf.toString(); } }));
app.use('/api/v1/webhooks', express.urlencoded({ extended: true, verify: (req: Request, _res: Response, buf: Buffer) => { req.rawBody = buf.toString(); } }));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const clientUrl = process.env.CLIENT_URL;
      if (!clientUrl || clientUrl === '*' || clientUrl.split(',').map((s) => s.trim()).includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(compression());
app.use(morgan('dev', { stream: { write: (msg: string) => logger.info(msg.trim()) } }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'BITO POS API',
    time: new Date().toISOString(),
  });
});
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'BITO POS API',
    time: new Date().toISOString(),
  });
});
app.get('/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'BITO POS API',
    time: new Date().toISOString(),
  });
});

app.use('/api/v1', routes);
app.use('/v1', routes);

// Static file serving for React build (Single deployment for Vercel / Node)
const candidateDistPaths = [
  path.resolve(__dirname, '../../web/dist'),
  path.resolve(__dirname, '../../../apps/web/dist'),
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(process.cwd(), 'web/dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];

const clientDistPath = candidateDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  logger.info(`[Static] Serving React app from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA fallback compatible with Express 5
  app.use((req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

app.use(errorHandler);
