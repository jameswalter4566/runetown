-- Ensure all columns exist in token_launches table
-- This migration adds any missing columns without failing if they already exist

-- Add image_url column if it doesn't exist
ALTER TABLE public.token_launches 
ADD COLUMN IF NOT EXISTS image_url text;

-- Add description column if it doesn't exist
ALTER TABLE public.token_launches 
ADD COLUMN IF NOT EXISTS description text;

-- Add lets_bonk_url column if it doesn't exist
ALTER TABLE public.token_launches 
ADD COLUMN IF NOT EXISTS lets_bonk_url text;

-- Add transaction_hash column if it doesn't exist
ALTER TABLE public.token_launches 
ADD COLUMN IF NOT EXISTS transaction_hash text;

-- Add any other columns that might be missing
ALTER TABLE public.token_launches 
ADD COLUMN IF NOT EXISTS market_cap numeric DEFAULT 0;

ALTER TABLE public.token_launches 
ADD COLUMN IF NOT EXISTS mint_address text;

-- Also ensure the table has proper permissions for edge functions
GRANT ALL ON public.token_launches TO service_role;