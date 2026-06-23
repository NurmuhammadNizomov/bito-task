import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../common/utils/logger';

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error });
    process.exit(1);
  }
}
