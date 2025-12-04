-- Add missing lets_bonk_url column to token_launches table
ALTER TABLE public.token_launches 
ADD COLUMN IF NOT EXISTS lets_bonk_url text;