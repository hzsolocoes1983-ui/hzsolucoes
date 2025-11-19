import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { router } from '../src/routes/trpc.js';
import { initDatabase } from '../src/db/migrate.js';

// Express app para serverless
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

app.use('/', createExpressMiddleware({
  router,
  onError: ({ error, path, type }) => {
    console.error(`[tRPC Error] ${type} ${path}:`, error);
  },
}));

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await initDatabase();
      initialized = true;
      console.log('[vercel:trpc] Database initialized');
    } catch (err) {
      console.error('[vercel:trpc] Failed to initialize database:', err);
    }
  }
  return app(req, res);
}