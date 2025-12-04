-- Create generated_wallets table for storing player wallets
CREATE TABLE IF NOT EXISTS generated_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  public_key TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL,
  used_for_token TEXT,
  screen_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on public_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_wallets_public_key ON generated_wallets(public_key);

-- Create index on screen_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_wallets_screen_name ON generated_wallets(screen_name);

-- Add RLS (Row Level Security) policies
ALTER TABLE generated_wallets ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on generated_wallets" ON generated_wallets
FOR ALL USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generated_wallets_updated_at 
  BEFORE UPDATE ON generated_wallets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();