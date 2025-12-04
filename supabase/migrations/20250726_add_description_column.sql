-- Add missing description column to token_launches table
ALTER TABLE public.token_launches 
ADD COLUMN IF NOT EXISTS description text;