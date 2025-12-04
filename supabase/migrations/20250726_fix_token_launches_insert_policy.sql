-- Drop existing restrictive insert policy
DROP POLICY IF EXISTS "Users can create their own token launches" ON public.token_launches;

-- Create new policy that allows service role (edge functions) to insert
CREATE POLICY "Service role can insert token launches" ON public.token_launches
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also allow authenticated users to insert their own launches
CREATE POLICY "Users can insert their own token launches" ON public.token_launches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Grant INSERT permission to service_role
GRANT INSERT ON public.token_launches TO service_role;