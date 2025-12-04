-- Create custom users table with wallet and token information
CREATE TABLE IF NOT EXISTS public.users_custom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  wallet_public_key TEXT NOT NULL,
  wallet_private_key TEXT NOT NULL, -- Note: In production, this should be encrypted
  token_mint_address TEXT,
  character_model TEXT DEFAULT 'player.glb',
  body_type TEXT DEFAULT 'A' CHECK (body_type IN ('A', 'B')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster username lookups
CREATE INDEX idx_users_custom_username ON public.users_custom(username);

-- Create index for wallet lookups
CREATE INDEX idx_users_custom_wallet_public_key ON public.users_custom(wallet_public_key);

-- Add RLS policies
ALTER TABLE public.users_custom ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own data
CREATE POLICY "Users can read own data" ON public.users_custom
  FOR SELECT
  USING (true); -- Adjust this based on your auth strategy

-- Policy to allow user creation
CREATE POLICY "Allow user creation" ON public.users_custom
  FOR INSERT
  WITH CHECK (true); -- Adjust this based on your auth strategy

-- Policy to allow users to update their own data
CREATE POLICY "Users can update own data" ON public.users_custom
  FOR UPDATE
  USING (true); -- Adjust this based on your auth strategy