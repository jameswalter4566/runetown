-- QUICK FIX: Run this in Supabase SQL Editor to fix the users table
-- This ensures all required columns exist

-- Add missing columns if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS mint_address TEXT,
ADD COLUMN IF NOT EXISTS market_cap DECIMAL(15, 2) DEFAULT 4200.00,
ADD COLUMN IF NOT EXISTS wallet_public_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_private_key TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_mint_address ON public.users(mint_address);
CREATE INDEX IF NOT EXISTS idx_users_market_cap ON public.users(market_cap);
CREATE INDEX IF NOT EXISTS idx_users_wallet_public_address ON public.users(wallet_public_address);

-- Fix penguin_color column to allow 7 characters (for hex without #)
ALTER TABLE public.users 
ALTER COLUMN penguin_color TYPE VARCHAR(7);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;