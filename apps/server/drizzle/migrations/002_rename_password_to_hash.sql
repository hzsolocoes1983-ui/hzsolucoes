-- Migration: Rename password column to password_hash
-- Created: 2025-11-20
-- Purpose: Prepare for bcrypt password hashing

-- SQLite doesn't support RENAME COLUMN directly in older versions
-- So we'll use ALTER TABLE with a workaround

-- Step 1: Add new column
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Step 2: Copy data from old column to new column
UPDATE users SET password_hash = password;

-- Step 3: We cannot drop the old column in SQLite easily
-- So we'll just leave it and use password_hash going forward
-- The application will only use password_hash from now on

-- Note: If you want a clean schema, you would need to:
-- 1. Create a new table with the correct schema
-- 2. Copy all data
-- 3. Drop old table
-- 4. Rename new table
-- But for simplicity, we'll just add the new column
