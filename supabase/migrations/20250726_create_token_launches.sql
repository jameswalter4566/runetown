-- Create token_launches table to track all token launches
CREATE TABLE IF NOT EXISTS public.token_launches (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  token_name text NOT NULL,
  token_symbol text NOT NULL,
  token_address text NOT NULL,
  mint_address text NOT NULL,
  image_url text,
  description text,
  market_cap numeric DEFAULT 0,
  lets_bonk_url text,
  transaction_hash text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_token_launches_created_at ON public.token_launches(created_at DESC);
CREATE INDEX idx_token_launches_user_id ON public.token_launches(user_id);
CREATE INDEX idx_token_launches_token_address ON public.token_launches(token_address);

-- Enable Row Level Security
ALTER TABLE public.token_launches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Token launches are viewable by all authenticated users" ON public.token_launches
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own token launches" ON public.token_launches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_token_launches_updated_at
  BEFORE UPDATE ON public.token_launches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT ON public.token_launches TO authenticated;
GRANT INSERT ON public.token_launches TO authenticated;