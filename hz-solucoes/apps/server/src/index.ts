import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { router } from './routes/trpc.js';
import whatsappRouter from './routes/whatsapp.js';
import { initDatabase } from './db/migrate.js';

const app = express();

// CORS configuration - allow all origins in development, specific in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Middleware de tratamento de erros para tRPC
app.use('/trpc', createExpressMiddleware({ 
  router,
  onError: ({ error, path, type }) => {
    console.error(`[tRPC Error] ${type} ${path}:`, error);
  }
}));
app.use('/whatsapp', whatsappRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0'; // Importante para produção

// Inicializa banco de dados
initDatabase().then(() => {
  app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
    console.log(`Health check: http://${host}:${port}/health`);
    console.log(`WhatsApp webhook: http://${host}:${port}/whatsapp/webhook`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});