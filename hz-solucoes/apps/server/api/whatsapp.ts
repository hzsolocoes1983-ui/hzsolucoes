import express from 'express';
import cors from 'cors';
import whatsappRouter from '../src/routes/whatsapp.js';
import { initDatabase } from '../src/db/migrate.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use('/', whatsappRouter);

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await initDatabase();
      initialized = true;
      console.log('[vercel:whatsapp] Database initialized');
    } catch (err) {
      console.error('[vercel:whatsapp] Failed to initialize database:', err);
    }
  }
  return app(req, res);
}