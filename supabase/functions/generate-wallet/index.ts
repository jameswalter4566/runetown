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
    const { tokenName } = body
    
    // Generate new keypair
    const keypair = Keypair.generate()
    const publicKey = keypair.publicKey.toString()
    const secretKey = encode(keypair.secretKey)

    // Store the private key as-is (unencrypted)
    const privateKey = secretKey

    // If tokenName is provided, store in generated_wallets table
    if (tokenName) {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Store the generated wallet
      const { error: insertError } = await supabase
        .from('generated_wallets')
        .insert({
          public_key: publicKey,
          encrypted_private_key: privateKey,
          used_for_token: tokenName
        })

      if (insertError) {
        console.error(`Failed to store wallet in generated_wallets table: ${insertError.message}`)
        // Continue anyway - we'll store it in the users table
      }

      console.log(`Generated new wallet for ${tokenName}: ${publicKey}`)
    } else {
      console.log(`Generated new wallet (not stored): ${publicKey}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        publicKey,
        privateKey, // Return unencrypted private key
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