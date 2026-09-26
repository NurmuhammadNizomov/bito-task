import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';
import { env } from '../../config/env';

const { combine, timestamp, errors, json, colorize, simple } = format;

const isDev = env.NODE_ENV !== 'production';

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

const rotateOptions = {
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  zippedArchive: true,
  createSymlink: false,
};

const isVercel = Boolean(process.env.VERCEL);

const loggerTransports: any[] = [
  new transports.Console({
    format: isDev ? combine(colorize(), simple()) : combine(timestamp(), json()),
  }),
];

if (!isVercel) {
  try {
    loggerTransports.push(
      new DailyRotateFile({
        ...rotateOptions,
        filename: join(env.LOG_DIR, 'app-%DATE%.log'),
        format: fileFormat,
      }),
      new DailyRotateFile({
        ...rotateOptions,
        filename: join(env.LOG_DIR, 'error-%DATE%.log'),
        level: 'error',
        format: fileFormat,
      })
    );
  } catch {
    // Fallback to console only if filesystem is read-only
  }
}

export const logger = createLogger({
  level: isDev ? 'debug' : env.LOG_LEVEL,
  transports: loggerTransports,
});
