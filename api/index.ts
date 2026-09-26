import { app } from '../apps/server/src/app';
import { connectDB } from '../apps/server/src/config/db';

// Ensure DB is connected before handling serverless requests
let dbConnecting: Promise<void> | null = null;

export default async function handler(req: any, res: any) {
  if (!dbConnecting) {
    dbConnecting = connectDB().catch((err) => {
      dbConnecting = null;
      console.error('[Vercel Serverless DB Error]:', err);
      throw err;
    });
  }
  await dbConnecting;
  return app(req, res);
}
