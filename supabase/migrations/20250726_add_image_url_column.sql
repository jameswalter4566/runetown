-- Add missing image_url column to token_launches table
ALTER TABLE public.token_launches 
ADD COLUMN IF NOT EXISTS image_url text;