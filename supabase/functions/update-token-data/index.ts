import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenData {
  token: {
    name: string;
    symbol: string;
    mint: string;
    decimals: number;
    image: string;
  };
  pools: Array<{
    poolId: string;
    liquidity: {
      usd: number;
    };
    price: {
      usd: number;
    };
    marketCap: {
      usd: number;
    };
  }>;
  holders: number;
}

async function fetchTokenData(tokenAddress: string, apiKey: string): Promise<TokenData | null> {
  try {
    const response = await fetch(`https://data.solanatracker.io/tokens/${tokenAddress}`, {
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.error(`HTTP 403 Forbidden - Invalid or missing API key for token ${tokenAddress}`);
        console.error('Please verify your SOLANA_TRACKER_KEY is valid and has not expired');
      } else if (response.status === 404) {
        console.log(`Token ${tokenAddress} not found on Solana Tracker (404) - might be too new or not indexed yet`);
      } else if (response.status === 500) {
        console.log(`Solana Tracker API error (500) for token ${tokenAddress} - skipping`);
      } else {
        console.error(`HTTP error! status: ${response.status} for token ${tokenAddress}`);
      }
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const solanaTrackerKey = Deno.env.get('SOLANA_TRACKER_KEY')

    if (!solanaTrackerKey) {
      console.error('SOLANA_TRACKER_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ 
          error: 'Solana Tracker API key not configured',
          message: 'Please set SOLANA_TRACKER_KEY in Supabase dashboard under Edge Functions settings'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }
    
    console.log('Solana Tracker API key found, starting token updates...');

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all users with mint addresses
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, mint_address')
      .not('mint_address', 'is', null)

    if (usersError) {
      throw usersError
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with mint addresses found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Configuration based on Solana Tracker API plan
    // Free: 1 req/sec, Starter: No limit but let's be reasonable
    const API_PLAN = Deno.env.get('SOLANA_TRACKER_PLAN') || 'free';
    
    const CONFIG = {
      free: { batchSize: 1, delayMs: 1100 }, // 1 token per second + buffer
      starter: { batchSize: 10, delayMs: 500 }, // 10 tokens per 0.5 seconds
      advanced: { batchSize: 20, delayMs: 200 }, // Faster processing
      pro: { batchSize: 50, delayMs: 100 } // Even faster
    };
    
    const config = CONFIG[API_PLAN as keyof typeof CONFIG] || CONFIG.free;
    const BATCH_SIZE = config.batchSize;
    const DELAY_BETWEEN_BATCHES = config.delayMs;
    
    const updates = [];
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      // Process current batch
      const batchUpdates = await Promise.all(
        batch.map(async (user) => {
          try {
            const tokenData = await fetchTokenData(user.mint_address, solanaTrackerKey)
            
            if (!tokenData || !tokenData.pools || tokenData.pools.length === 0) {
              console.log(`No valid data for token ${user.mint_address} (user: ${user.penguin_name || user.id})`)
              return null
            }

            const marketCap = tokenData.pools[0].marketCap.usd
            const holders = tokenData.holders

            // Update user data
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                market_cap: marketCap,
                holders: holders,
                last_token_update: new Date().toISOString()
              })
              .eq('id', user.id)

            if (updateError) {
              console.error(`Error updating user ${user.id}:`, updateError)
              return null
            }

            return {
              userId: user.id,
              mintAddress: user.mint_address,
              marketCap,
              holders
            }
          } catch (error) {
            console.error(`Error processing token ${user.mint_address}:`, error)
            return null
          }
        })
      );
      
      updates.push(...batchUpdates);
      
      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < users.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    const successfulUpdates = updates.filter(u => u !== null)
    const failedCount = users.length - successfulUpdates.length;

    console.log(`Token update summary: ${successfulUpdates.length} successful, ${failedCount} failed/skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated ${successfulUpdates.length} tokens, ${failedCount} failed/skipped`,
        totalProcessed: users.length,
        successCount: successfulUpdates.length,
        failedCount: failedCount,
        updates: successfulUpdates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
