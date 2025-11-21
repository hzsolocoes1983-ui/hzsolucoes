import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'libsql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./local.db',
  },
} satisfies Config;
