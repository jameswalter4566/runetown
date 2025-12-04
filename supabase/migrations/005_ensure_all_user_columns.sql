-- Ensure all required columns exist in the users table
-- This migration ensures the schema is complete even if previous migrations were not run

-- Add missing columns if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS mint_address TEXT,
ADD COLUMN IF NOT EXISTS market_cap DECIMAL(15, 2) DEFAULT 4200.00,
ADD COLUMN IF NOT EXISTS wallet_public_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_private_key TEXT;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_users_mint_address ON public.users(mint_address);
CREATE INDEX IF NOT EXISTS idx_users_market_cap ON public.users(market_cap);
CREATE INDEX IF NOT EXISTS idx_users_wallet_public_address ON public.users(wallet_public_address);

-- Update penguin_color column to VARCHAR(7) if needed (for hex colors without #)
ALTER TABLE public.users 
ALTER COLUMN penguin_color TYPE VARCHAR(7);

-- Add comments for clarity
COMMENT ON COLUMN public.users.mint_address IS 'The Solana mint address for the user''s penguin token';
COMMENT ON COLUMN public.users.market_cap IS 'The current market capitalization of the user''s token in USD';
COMMENT ON COLUMN public.users.wallet_public_address IS 'The public address of the user''s Solana wallet';
COMMENT ON COLUMN public.users.wallet_private_key IS 'The encrypted private key of the user''s Solana wallet (should be encrypted in production)';