import { app } from '../apps/server/src/app';
import { connectDB } from '../apps/server/src/config/db';

// Ensure DB is connected for serverless invocations
connectDB().catch((err) => console.error('[Vercel Serverless DB Error]:', err));

export default app;
