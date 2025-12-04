-- =====================================================
-- FANTASY MAP SKETCHPAD LEADERBOARD SQL SETUP
-- =====================================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- This will create all necessary tables, indexes, and policies

-- Create leaderboard table for tracking player scores
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  time_held_seconds NUMERIC NOT NULL,
  supply_earned_percentage NUMERIC NOT NULL,
  transaction_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on time_held_seconds for leaderboard sorting (most important for performance)
CREATE INDEX IF NOT EXISTS idx_leaderboard_time_held ON leaderboard(time_held_seconds DESC);

-- Create index on created_at for recent entries
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);

-- Create index on wallet_address for user-specific queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_wallet ON leaderboard(wallet_address);

-- Add RLS (Row Level Security) policies
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy to allow reading leaderboard data (public read access)
CREATE POLICY "Allow read access to leaderboard" ON leaderboard
FOR SELECT USING (true);

-- Policy to allow inserting new scores (public insert access)
CREATE POLICY "Allow insert to leaderboard" ON leaderboard
FOR INSERT WITH CHECK (true);

-- Optional: Create a view for top 100 leaderboard (for better performance)
CREATE OR REPLACE VIEW top_leaderboard AS
SELECT 
  id,
  screen_name,
  wallet_address,
  time_held_seconds,
  supply_earned_percentage,
  transaction_hash,
  created_at,
  ROW_NUMBER() OVER (ORDER BY time_held_seconds DESC) as rank
FROM leaderboard
ORDER BY time_held_seconds DESC
LIMIT 100;

-- Grant access to the view
GRANT SELECT ON top_leaderboard TO anon, authenticated;

-- =====================================================
-- VERIFICATION QUERIES (Optional - run to test)
-- =====================================================

-- Test: Insert a sample record
-- INSERT INTO leaderboard (screen_name, wallet_address, time_held_seconds, supply_earned_percentage, transaction_hash)
-- VALUES ('TestPlayer', 'test_wallet_123', 150.5, 25.75, 'test_tx_hash_123');

-- Test: Query top 10 scores
-- SELECT * FROM leaderboard ORDER BY time_held_seconds DESC LIMIT 10;

-- Test: Check table structure
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'leaderboard';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================