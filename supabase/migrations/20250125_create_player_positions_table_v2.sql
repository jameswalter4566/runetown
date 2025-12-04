-- Drop the old table if it exists
DROP TABLE IF EXISTS player_positions CASCADE;

-- Create player_positions table for real-time multiplayer positioning
CREATE TABLE player_positions (
    id BIGSERIAL PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL, -- Changed from UUID to VARCHAR to support any ID format
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    direction VARCHAR(20) NOT NULL,
    model_type VARCHAR(50),
    screen_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_player_positions_player_id ON player_positions(player_id);
CREATE INDEX idx_player_positions_timestamp ON player_positions(timestamp);

-- Enable real-time for the table
ALTER TABLE player_positions REPLICA IDENTITY FULL;

-- Enable Row Level Security (but with permissive policies)
ALTER TABLE player_positions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert positions
CREATE POLICY "Anyone can insert positions" ON player_positions
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create policy to allow anyone to read positions
CREATE POLICY "Anyone can read positions" ON player_positions
    FOR SELECT TO anon
    USING (true);

-- Create a function to clean up old positions (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_old_positions()
RETURNS void AS $$
BEGIN
    DELETE FROM player_positions
    WHERE timestamp < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;