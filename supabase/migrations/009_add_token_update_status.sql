-- Add columns to track token update status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS token_update_failures INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS token_update_last_error TEXT,
ADD COLUMN IF NOT EXISTS token_update_last_attempt TIMESTAMP WITH TIME ZONE;

-- Create an index for faster queries on tokens that need updates
CREATE INDEX IF NOT EXISTS idx_users_token_update_status 
ON users(mint_address, token_update_failures) 
WHERE mint_address IS NOT NULL;