-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own chats" ON public.player_chats;
DROP POLICY IF EXISTS "Users can read recent chats" ON public.player_chats;

-- Create new policies that allow all players to read all chats

-- Allow all authenticated users to insert chats
CREATE POLICY "Anyone can insert chats" ON public.player_chats
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Allow all users (authenticated and anonymous) to read ALL chats from the last 5 minutes
CREATE POLICY "Anyone can read all recent chats" ON public.player_chats
  FOR SELECT TO authenticated, anon
  USING (timestamp > NOW() - INTERVAL '5 minutes');

-- Also create a policy for service role to have full access
CREATE POLICY "Service role has full access" ON public.player_chats
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions to anon role as well
GRANT SELECT, INSERT ON public.player_chats TO anon;

-- Add comment about the policies
COMMENT ON POLICY "Anyone can read all recent chats" ON public.player_chats IS 'Allows all users to read any player chat messages from the last 5 minutes for real-time chat functionality';