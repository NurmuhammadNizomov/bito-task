import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../common/utils/logger';

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error });
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
}
