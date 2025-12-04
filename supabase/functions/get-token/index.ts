import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tokenAddress } = await req.json()
    
    if (!tokenAddress) {
      throw new Error('tokenAddress is required')
    }

    // Use hardcoded key since env var isn't working
    const solanaTrackerKey = 'fe0334b7-529a-4711-91a0-77764b1b5af7'

    // Fetch token data from Solana Tracker
    const response = await fetch(
      `https://data.solanatracker.io/tokens/${tokenAddress}`,
      {
        headers: {
          'x-api-key': solanaTrackerKey,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Token not found')
      }
      throw new Error(`Solana Tracker API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract relevant token information
    const tokenInfo = {
      address: tokenAddress,
      name: data.token?.name || 'Unknown Token',
      symbol: data.token?.symbol || 'Unknown',
      image: data.token?.image,
      price_usd: data.pools?.[0]?.price?.usd || 0,
      market_cap: data.pools?.[0]?.marketCap?.usd || 0,
      price_change_24h: data.events?.['24h']?.priceChangePercentage || 0,
      liquidity_usd: data.pools?.[0]?.liquidity?.usd || 0,
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: tokenInfo
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Token not found' ? 404 : 400 
      }
    )
  }
})