-- Add token-related columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS mint_address TEXT,
ADD COLUMN IF NOT EXISTS market_cap DECIMAL(15, 2) DEFAULT 4200.00;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_mint_address ON public.users(mint_address);
CREATE INDEX IF NOT EXISTS idx_users_market_cap ON public.users(market_cap);

-- Add comments for clarity
COMMENT ON COLUMN public.users.mint_address IS 'The Solana mint address for the user''s penguin token';
COMMENT ON COLUMN public.users.market_cap IS 'The current market capitalization of the user''s token in USD';