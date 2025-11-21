import { createClient } from '@libsql/client';

// Aplica índices ao banco (SQLite via libsql)
// Usa DATABASE_URL local por padrão
const url = process.env.DATABASE_URL || 'file:./local.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;
const client = createClient({ url, authToken });

async function applyIndexes() {
  console.log('[DB] Aplicando índices...');

  // Users
  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp);
  `);

  // Goals
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
  `);

  // Transactions
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
  `);

  // Items
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
  `);

  // Daily Care
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_daily_care_user_id ON daily_care(user_id);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_daily_care_type ON daily_care(type);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_daily_care_date ON daily_care(date);
  `);

  // Water Intake
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_water_user_id ON water_intake(user_id);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_water_date ON water_intake(date);
  `);

  // Accounts (se existir)
  try {
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    `);
  } catch (e) {
    console.warn('[DB] Tabela accounts ausente, ignorando índices de accounts');
  }

  console.log('[DB] Índices aplicados com sucesso.');
}

applyIndexes().catch((err) => {
  console.error('[DB] Falha ao aplicar índices:', err);
  process.exit(1);
});