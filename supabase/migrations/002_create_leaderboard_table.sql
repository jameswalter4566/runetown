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

-- Create index on time_held_seconds for leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_leaderboard_time_held ON leaderboard(time_held_seconds DESC);

-- Create index on created_at for recent entries
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy to allow reading leaderboard data
CREATE POLICY "Allow read access to leaderboard" ON leaderboard
FOR SELECT USING (true);

-- Policy to allow inserting new scores
CREATE POLICY "Allow insert to leaderboard" ON leaderboard
FOR INSERT WITH CHECK (true);