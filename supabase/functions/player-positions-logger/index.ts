import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authentication from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the latest positions from the last 5 minutes
    const { data: positions, error: fetchError } = await supabase
      .from('player_positions')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000)

    if (fetchError) {
      console.error('Error fetching positions:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch positions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group positions by player
    const playerPositions = new Map<string, any[]>()
    
    positions?.forEach(pos => {
      if (!playerPositions.has(pos.player_id)) {
        playerPositions.set(pos.player_id, [])
      }
      playerPositions.get(pos.player_id)!.push(pos)
    })

    // Format the response
    const formattedData = {
      totalPositions: positions?.length || 0,
      uniquePlayers: playerPositions.size,
      positions: Array.from(playerPositions.entries()).map(([playerId, positions]) => ({
        playerId,
        screenName: positions[0].screen_name,
        positionCount: positions.length,
        latestPosition: {
          x: positions[0].x,
          y: positions[0].y,
          direction: positions[0].direction,
          timestamp: positions[0].timestamp
        },
        recentPath: positions.slice(0, 10).map(p => ({
          x: p.x,
          y: p.y,
          timestamp: p.timestamp
        }))
      }))
    }

    return new Response(
      JSON.stringify(formattedData),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in player-positions-logger:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})