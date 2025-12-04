-- Add wallet-related columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS wallet_public_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_private_key TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_public_address ON public.users(wallet_public_address);

-- Add comments for clarity
COMMENT ON COLUMN public.users.wallet_public_address IS 'The public address of the user''s Solana wallet';
COMMENT ON COLUMN public.users.wallet_private_key IS 'The encrypted private key of the user''s Solana wallet (should be encrypted in production)';