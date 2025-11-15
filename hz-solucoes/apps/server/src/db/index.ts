import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

// Usa banco local por padrão, ou URL do Turso em produção
const url = process.env.DATABASE_URL || 'file:./local.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client);

