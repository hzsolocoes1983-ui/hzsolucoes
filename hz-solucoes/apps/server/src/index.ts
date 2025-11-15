import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { router } from './routes/trpc';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/trpc', createExpressMiddleware({ router }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});