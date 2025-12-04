-- Create user_messages table for real-time chat
CREATE TABLE IF NOT EXISTS public.user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for public messages
    message TEXT NOT NULL CHECK (char_length(message) <= 500),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_user_messages_sender_id ON public.user_messages(sender_id);
CREATE INDEX idx_user_messages_recipient_id ON public.user_messages(recipient_id);
CREATE INDEX idx_user_messages_created_at ON public.user_messages(created_at DESC);
CREATE INDEX idx_user_messages_public ON public.user_messages(created_at DESC) WHERE recipient_id IS NULL;

-- Enable Row Level Security
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view public messages
CREATE POLICY "Public messages are viewable by everyone" ON public.user_messages
    FOR SELECT
    USING (recipient_id IS NULL);

-- Users can view their own sent messages
CREATE POLICY "Users can view their sent messages" ON public.user_messages
    FOR SELECT
    USING (auth.uid() = sender_id);

-- Users can view messages sent to them
CREATE POLICY "Users can view received messages" ON public.user_messages
    FOR SELECT
    USING (auth.uid() = recipient_id);

-- Users can only send messages as themselves
CREATE POLICY "Users can send messages" ON public.user_messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_messages;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_user_messages_updated_at
    BEFORE UPDATE ON public.user_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.user_messages IS 'Stores chat messages between users, both public and private';