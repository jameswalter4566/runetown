import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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