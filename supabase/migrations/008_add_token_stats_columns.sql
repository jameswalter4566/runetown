-- Add columns for storing token market cap and holders
ALTER TABLE users
ADD COLUMN IF NOT EXISTS market_cap NUMERIC,
ADD COLUMN IF NOT EXISTS holders INTEGER,
ADD COLUMN IF NOT EXISTS last_token_update TIMESTAMP WITH TIME ZONE;