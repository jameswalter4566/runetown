-- Create token_launches table
CREATE TABLE IF NOT EXISTS public.token_launches (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  token_name text NOT NULL,
  token_symbol text NOT NULL,
  token_address text NOT NULL,
  transaction_signature text,
  initial_market_cap numeric,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_token_launches_created_at ON public.token_launches(created_at DESC);
CREATE INDEX idx_token_launches_user_id ON public.token_launches(user_id);

-- Enable RLS
ALTER TABLE public.token_launches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Token launches are viewable by everyone" ON public.token_launches
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own token launches" ON public.token_launches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.token_launches TO anon;
GRANT SELECT, INSERT ON public.token_launches TO authenticated;