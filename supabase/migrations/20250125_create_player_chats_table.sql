-- Create player_chats table for real-time chat messages
CREATE TABLE IF NOT EXISTS public.player_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  message TEXT NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  screen_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_player_chats_timestamp ON public.player_chats(timestamp DESC);
CREATE INDEX idx_player_chats_player_id ON public.player_chats(player_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.player_chats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to insert their own chats
CREATE POLICY "Users can insert their own chats" ON public.player_chats
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create policy to allow all users to read chats from the last 5 minutes
CREATE POLICY "Users can read recent chats" ON public.player_chats
  FOR SELECT TO authenticated
  USING (timestamp > NOW() - INTERVAL '5 minutes');

-- Grant permissions
GRANT ALL ON public.player_chats TO authenticated;
GRANT ALL ON public.player_chats TO service_role;

-- Add comment
COMMENT ON TABLE public.player_chats IS 'Stores player chat messages with their positions for spatial chat rendering';