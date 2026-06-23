import { createServer } from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './common/utils/logger';

const httpServer = createServer(app);

async function start() {
  await connectDB();

  httpServer.listen(env.SERVER_PORT, () => {
    logger.info(`Server running on port ${env.SERVER_PORT}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
