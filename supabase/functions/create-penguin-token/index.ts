import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Keypair } from 'https://esm.sh/@solana/web3.js@1.87.6';
import { encode as base58Encode } from "https://deno.land/std@0.168.0/encoding/base58.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, penguinName, penguinColor, imageBase64 } = await req.json();
    
    if (!userId || !penguinName || !imageBase64) {
      throw new Error('userId, penguinName, and imageBase64 are required');
    }

    // Use penguin name as both name and symbol
    const name = penguinName;
    const symbol = penguinName.toUpperCase().replace(/\s+/g, '');
    const description = `${penguinName}'s official penguin token! Created in Club Penguin Legacy.`;

    console.log(`Creating token for penguin: ${name} (${symbol})`);

    // Generate a random keypair for the mint
    const mintKeypair = Keypair.generate();
    
    // Encode the secret key to base58 for the API
    const mintSecretKey = base58Encode(mintKeypair.secretKey);
    const mintPublicKey = mintKeypair.publicKey.toString();
    
    console.log('Generated unique token mint address:', mintPublicKey);

    // Upload penguin image to IPFS
    console.log('Uploading penguin image to IPFS...');
    const formData = new FormData();
    const blob = new Blob([Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))], { type: 'image/png' });
    formData.append("image", blob, "token.png"); // Changed from penguin.png to token.png to match example

    const imgResponse = await fetch("https://nft-storage.letsbonk22.workers.dev/upload/img", {
      method: "POST",
      body: formData,
    });
    
    if (!imgResponse.ok) {
      const errorText = await imgResponse.text();
      console.error('Image upload failed:', imgResponse.status, errorText);
      throw new Error(`Image upload failed: ${imgResponse.statusText} - ${errorText}`);
    }
    
    const imgUri = await imgResponse.text();
    console.log('Image URI:', imgUri);

    // Upload metadata with image URI
    console.log('Creating metadata with image URI...');
    const metadataResponse = await fetch("https://nft-storage.letsbonk22.workers.dev/upload/meta", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        createdOn: "https://bonk.fun",
        description: description,
        image: imgUri,
        name: name,
        symbol: symbol,
        website: "https://clubpenguin.fun/",
        twitter: "https://x.com/clubpenguin_fun"
      }),
    });
    
    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error('Metadata upload failed:', metadataResponse.status, errorText);
      throw new Error(`Metadata upload failed: ${metadataResponse.statusText} - ${errorText}`);
    }
    
    let metadataUri = await metadataResponse.text();
    console.log('Metadata URI:', metadataUri);

    // Get the create transaction
    const pumpPortalAPIKey = Deno.env.get('PUMPPORTAL_API_KEY');
    if (!pumpPortalAPIKey) {
      throw new Error('PUMPPORTAL_API_KEY environment variable not set');
    }
    console.log('PumpPortal API Key exists: true');
    
    const requestBody = {
      action: "create",
      tokenMetadata: {
        name: name,
        symbol: symbol,
        uri: metadataUri,
      },
      mint: mintSecretKey,
      denominatedInSol: "true",
      amount: 0.01,
      slippage: 5,
      priorityFee: 0.00005,
      pool: "bonk"
    };
    
    console.log('PumpPortal request body:', JSON.stringify({
      ...requestBody,
      mint: "***SECRET_KEY_HIDDEN***" // Hide secret key in logs
    }, null, 2));
    
    console.log('Creating token on pump.fun...');
    
    const response = await fetch(
      `https://pumpportal.fun/api/trade?api-key=${pumpPortalAPIKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('PumpPortal response status:', response.status);
    console.log('PumpPortal response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('PumpPortal raw response:', responseText);

    if (response.status === 200) {
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('PumpPortal parsed response:', JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('Failed to parse PumpPortal response as JSON:', error);
        throw new Error('Invalid JSON response from PumpPortal API');
      }
      
      // Check if there are errors in the response
      if (data.errors && data.errors.length > 0) {
        console.error('PumpPortal API returned errors:', data.errors);
        throw new Error(`PumpPortal API error: ${data.errors.join(', ')}`);
      }
      
      // Extract the actual mint address
      let actualMintAddress = mintPublicKey;
      if (data.mint) {
        actualMintAddress = data.mint;
      } else if (data.tokenAddress) {
        actualMintAddress = data.tokenAddress;
      }
      
      console.log("Transaction signature from API:", data.signature);
      console.log("Transaction: https://solscan.io/tx/" + data.signature);
      console.log("Token mint address:", actualMintAddress);
      
      // Update user record with the actual token mint address
      console.log('Updating user record with token data...');
      const { data: userUpdate, error: updateError } = await supabase
        .from('users')
        .update({
          token_mint_address: actualMintAddress,
          mint_address: actualMintAddress,
          market_cap: 4200.00 // Starting market cap
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Failed to update user record with token data');
      }

      console.log('User record updated successfully:', userUpdate.id);

      // Fetch initial token data after a short delay
      setTimeout(async () => {
        try {
          const solanaTrackerKey = Deno.env.get('SOLANA_TRACKER_KEY');
          if (solanaTrackerKey) {
            const tokenResponse = await fetch(`https://data.solanatracker.io/tokens/${actualMintAddress}`, {
              headers: {
                'x-api-key': solanaTrackerKey
              }
            });
            
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              if (tokenData && tokenData.pools && tokenData.pools.length > 0) {
                await supabase
                  .from('users')
                  .update({
                    market_cap: tokenData.pools[0].marketCap.usd,
                    holders: tokenData.holders,
                    last_token_update: new Date().toISOString()
                  })
                  .eq('id', userId);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching initial token data:', error);
        }
      }, 5000); // Wait 5 seconds for token to be indexed

      return new Response(JSON.stringify({
        success: true,
        mintAddress: actualMintAddress,
        transactionSignature: data.signature,
        solscanUrl: `https://solscan.io/tx/${data.signature}`,
        pumpFunUrl: `https://pump.fun/coin/${actualMintAddress}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('PumpPortal API error:', response.statusText);
      console.error('PumpPortal API response:', responseText);
      
      throw new Error(`PumpPortal API error: ${response.statusText} - ${responseText}`);
    }

  } catch (error) {
    console.error('Error in create-penguin-token function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create token' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});