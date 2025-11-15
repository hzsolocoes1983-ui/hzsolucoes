import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { router } from './routes/trpc.js';
import { initDatabase } from './db/migrate.js';

const app = express();

// CORS configuration - allow all origins in development, specific in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/trpc', createExpressMiddleware({ router }));

const port = process.env.PORT || 3000;

// Inicializa banco de dados
initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});