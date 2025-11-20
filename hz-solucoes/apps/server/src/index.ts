import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { router } from './routes/trpc.js';
import whatsappRouter from './routes/whatsapp.js';
import { initDatabase } from './db/migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration - secure by default
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*')
    : (process.env.CORS_ORIGIN || '*'), // Em desenvolvimento, permite todas as origens
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Log de requisições para debug
app.use('/trpc', (req, res, next) => {
  console.log('[tRPC Request]', {
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query
  });
  next();
});

// Middleware de tratamento de erros para tRPC
app.use('/trpc', createExpressMiddleware({ 
  router,
  createContext: ({ req, res }) => ({}), // Contexto vazio por enquanto
  onError: ({ error, path, type }) => {
    console.error(`[tRPC Error] ${type} ${path}:`, error);
  }
}));
app.use('/whatsapp', whatsappRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir arquivos estáticos do frontend (após build)
const frontendDistPath = path.resolve(__dirname, '../../web/dist');
app.use(express.static(frontendDistPath));

// Fallback para SPA: todas as rotas não-API retornam index.html
app.get('*', (req, res, next) => {
  // Ignorar rotas de API
  if (req.path.startsWith('/trpc') || 
      req.path.startsWith('/whatsapp') || 
      req.path.startsWith('/health')) {
    return next();
  }
  
  // Servir index.html para todas as outras rotas (SPA routing)
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

const port = process.env.PORT || 3000;

// Inicializa banco de dados
initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`WhatsApp webhook: http://localhost:${port}/whatsapp/webhook`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});