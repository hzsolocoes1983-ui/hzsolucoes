import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { router } from './routes/trpc-secure.js';
import whatsappRouter from './routes/whatsapp.js';
import { initDatabase } from './db/migrate.js';

const app = express();

// ==================== CORS CONFIGURATION ====================
// Configuração segura de CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN || 'http://localhost:5173'
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// ==================== RATE LIMITING ====================
// Proteção contra abuso de API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 req em prod, 1000 em dev
  message: {
    error: 'Muitas requisições deste IP, tente novamente mais tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Não aplicar rate limit em health check
  skip: (req) => req.path === '/health',
});

// Aplicar rate limiting apenas em rotas de API
app.use('/trpc', limiter);
app.use('/whatsapp', limiter);

// ==================== LOGGING ====================
// Log de requisições para debug (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  app.use('/trpc', (req, res, next) => {
    console.log('[tRPC Request]', {
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
      ip: req.ip,
    });
    next();
  });
}

// ==================== TRPC MIDDLEWARE ====================
app.use('/trpc', createExpressMiddleware({
  router,
  createContext: ({ req, res }) => ({
    req,
    res,
  }),
  onError: ({ error, path, type, ctx }) => {
    console.error(`[tRPC Error] ${type} ${path}:`, {
      message: error.message,
      code: error.code,
      ip: ctx?.req?.ip,
    });
    
    // Em produção, não expor detalhes internos do erro
    if (process.env.NODE_ENV === 'production') {
      // O tRPC já trata isso, mas podemos adicionar logging extra aqui
    }
  }
}));

// ==================== WHATSAPP WEBHOOK ====================
app.use('/whatsapp', whatsappRouter);

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
  });
});

// ==================== ERROR HANDLER ====================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Express Error]', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
});

// ==================== START SERVER ====================
const port = process.env.PORT || 3000;

initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
    console.log(`📱 WhatsApp webhook: http://localhost:${port}/whatsapp/webhook`);
    console.log(`🏥 Health check: http://localhost:${port}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 CORS: ${corsOptions.origin}`);
  });
}).catch((error) => {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
});
