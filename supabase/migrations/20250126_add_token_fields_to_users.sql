-- Add mint_address and market_cap fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS mint_address TEXT,
ADD COLUMN IF NOT EXISTS market_cap DECIMAL(10, 2) DEFAULT 4200;