-- Migration: Add indexes for better query performance
-- Created: 2025-11-20

-- Index for transactions by user and date (most common query)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

-- Index for transactions by type (filtering income/expense)
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Index for transactions by user and type (combined filter)
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);

-- Index for items by user and status (shopping list queries)
CREATE INDEX IF NOT EXISTS idx_items_user_status ON items(user_id, status);

-- Index for daily care by user and date
CREATE INDEX IF NOT EXISTS idx_daily_care_user_date ON daily_care(user_id, date);

-- Index for water intake by user and date
CREATE INDEX IF NOT EXISTS idx_water_intake_user_date ON water_intake(user_id, date);

-- Index for goals by user
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- Index for accounts by user
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
