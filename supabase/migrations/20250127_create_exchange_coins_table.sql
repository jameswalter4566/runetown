-- Create exchange_coins table for Grand Exchange listings
CREATE TABLE IF NOT EXISTS exchange_coins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  image_url TEXT,
  price_usd DECIMAL(20, 10),
  market_cap DECIMAL(20, 2),
  price_change_24h DECIMAL(10, 2),
  liquidity_usd DECIMAL(20, 2),
  likes INTEGER DEFAULT 0,
  listed_by UUID REFERENCES users(id),
  listed_by_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for sorting
CREATE INDEX idx_exchange_coins_created_at ON exchange_coins(created_at DESC);
CREATE INDEX idx_exchange_coins_likes ON exchange_coins(likes DESC);
CREATE INDEX idx_exchange_coins_market_cap ON exchange_coins(market_cap DESC);

-- Enable RLS
ALTER TABLE exchange_coins ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can read all exchange coins
CREATE POLICY "Anyone can read exchange coins" ON exchange_coins
  FOR SELECT
  USING (true);

-- Authenticated users can insert coins
CREATE POLICY "Authenticated users can insert coins" ON exchange_coins
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update likes on any coin
CREATE POLICY "Anyone can update likes" ON exchange_coins
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create function to increment likes
CREATE OR REPLACE FUNCTION increment_coin_likes(coin_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE exchange_coins
  SET likes = likes + 1,
      updated_at = now()
  WHERE id = coin_id;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for exchange_coins
ALTER PUBLICATION supabase_realtime ADD TABLE exchange_coins;