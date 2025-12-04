-- Create chat messages table for real-time messaging
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  penguin_name VARCHAR(12) NOT NULL,
  penguin_color VARCHAR(7) NOT NULL,
  message TEXT NOT NULL,
  map_area VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for performance
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_map_area ON public.chat_messages(map_area);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages (for game)
CREATE POLICY "Anyone can read chat messages" ON public.chat_messages
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own messages
CREATE POLICY "Users can create their own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;