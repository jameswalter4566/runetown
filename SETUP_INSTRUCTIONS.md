# 🚀 Setup Instructions for Wallet Game

## Project: tmyqmhptjurwytddjswg

### Step 1: Update API Keys
1. Go to: https://supabase.com/dashboard/project/tmyqmhptjurwytddjswg/settings/api
2. Copy your **anon/public** key
3. Replace `YOUR_ANON_KEY_HERE` in `src/integrations/supabase/client.ts` with your actual key

### Step 2: Create Database Table
1. Go to: https://supabase.com/dashboard/project/tmyqmhptjurwytddjswg/sql/new
2. Run this SQL:

```sql
-- Create generated_wallets table for storing player wallets
CREATE TABLE IF NOT EXISTS generated_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  public_key TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL, -- Note: Now stores unencrypted private keys
  used_for_token TEXT,
  screen_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on public_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_wallets_public_key ON generated_wallets(public_key);

-- Create index on screen_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_wallets_screen_name ON generated_wallets(screen_name);

-- Add RLS (Row Level Security) policies
ALTER TABLE generated_wallets ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on generated_wallets" ON generated_wallets
FOR ALL USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generated_wallets_updated_at 
  BEFORE UPDATE ON generated_wallets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Create Edge Functions
#### A. Generate Wallet Function
1. Go to: https://supabase.com/dashboard/project/tmyqmhptjurwytddjswg/functions
2. Click "Create a new function"
3. Name: `generate-wallet`
4. Paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Keypair } from 'https://esm.sh/@solana/web3.js@1.87.6'
import { encode, decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { tokenName, screenName } = body
    
    // Generate new keypair
    const keypair = Keypair.generate()
    const publicKey = keypair.publicKey.toString()
    const secretKey = encode(keypair.secretKey)

    // Encrypt the private key before storing (in production, use proper encryption)
    // For now, we'll use base64 encoding as a placeholder
    const encryptedPrivateKey = secretKey

    // If tokenName is provided, store in generated_wallets table
    if (tokenName && screenName) {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Store the generated wallet
      const { error: insertError } = await supabase
        .from('generated_wallets')
        .insert({
          public_key: publicKey,
          encrypted_private_key: encryptedPrivateKey,
          used_for_token: tokenName,
          screen_name: screenName
        })

      if (insertError) {
        throw new Error(`Failed to store wallet: ${insertError.message}`)
      }

      console.log(`Generated new wallet for ${screenName} (${tokenName}): ${publicKey}`)
    } else {
      console.log(`Generated new wallet (not stored): ${publicKey}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        publicKey,
        encryptedPrivateKey, // Return this for user dev wallets
        message: 'Wallet generated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error generating wallet:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

#### B. Submit Score Function (for Leaderboard)
1. Create another function named: `submit-score`
2. Paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { screenName, walletAddress, timeHeldSeconds, supplyEarnedPercentage, transactionHash } = body
    
    if (!screenName || !walletAddress || timeHeldSeconds === undefined || supplyEarnedPercentage === undefined || !transactionHash) {
      throw new Error('Missing required fields')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert the score into leaderboard
    const { data, error: insertError } = await supabase
      .from('leaderboard')
      .insert({
        screen_name: screenName,
        wallet_address: walletAddress,
        time_held_seconds: timeHeldSeconds,
        supply_earned_percentage: supplyEarnedPercentage,
        transaction_hash: transactionHash
      })
      .select()

    if (insertError) {
      throw new Error(`Failed to submit score: ${insertError.message}`)
    }

    console.log(`Score submitted for ${screenName}: ${timeHeldSeconds}s, ${supplyEarnedPercentage}%`)

    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        message: 'Score submitted successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error submitting score:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

### Step 4: Set Environment Variables
1. Go to: https://supabase.com/dashboard/project/tmyqmhptjurwytddjswg/functions
2. Click on your `generate-wallet` function
3. Go to "Settings" tab
4. Add these environment variables:
   - `SUPABASE_URL`: `https://tmyqmhptjurwytddjswg.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: (get this from Settings > API > service_role key)

### Step 5: Deploy and Test
1. Deploy the edge function
2. Test your game wallet generation!

## 🎮 Game Features
- ✅ Solana wallet generation for each player
- ✅ Slide-to-unlock private key reveal
- ✅ Jackpot prize pool (+0.02 SOL per fall)
- ✅ Individual player supply rewards (0.01% per 10 minutes)
- ✅ Real-time leaderboard with live updates
- ✅ Automatic score submission when players fall
- ✅ Transaction hash links to Solscan
- ✅ Comic book animated fonts throughout
- ✅ Congratulations screen with detailed stats
- ✅ Treasury wallet display

## URLs for your project:
- Dashboard: https://supabase.com/dashboard/project/tmyqmhptjurwytddjswg
- API Settings: https://supabase.com/dashboard/project/tmyqmhptjurwytddjswg/settings/api
- Edge Functions: https://supabase.com/dashboard/project/tmyqmhptjurwytddjswg/functions
- SQL Editor: https://supabase.com/dashboard/project/tmyqmhptjurwytddjswg/sql