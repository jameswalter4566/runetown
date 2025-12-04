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

    const { userId, username } = await req.json();
    
    if (!userId || !username) {
      throw new Error('User ID and username are required');
    }

    // Ensure username is max 32 characters for token name
    const tokenName = username.slice(0, 32);
    const symbol = "RUNES";
    const description = "A unique MMO set in the vast, fantasy world of Gielinor, brimming with diverse races, guilds and ancient gods battling for dominion";
    const imageUrl = "https://cxfdlucjgngfzudjjsjc.supabase.co/storage/v1/object/public/images/RUNESCAPETOKENIMAGE.jpg";

    console.log(`Creating token for user ${userId}: ${tokenName} (${symbol})`);

    // Generate a random keypair for the mint
    const mintKeypair = Keypair.generate();
    
    // Encode the secret key to base58 for the API
    const mintSecretKey = base58Encode(mintKeypair.secretKey);
    const mintPublicKey = mintKeypair.publicKey.toString();
    
    console.log('Generated unique token mint address:', mintPublicKey);

    // Fetch the RuneScape logo and convert to base64
    console.log('Fetching RuneScape logo...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageUint8Array = new Uint8Array(imageArrayBuffer);
    
    // Create form data with the image blob
    const formData = new FormData();
    const imageBlob = new Blob([imageUint8Array], { type: 'image/jpeg' });
    formData.append("image", imageBlob, "runescapelogo.jpg");

    console.log('Uploading image to IPFS...');
    const imgUploadResponse = await fetch("https://nft-storage.letsbonk22.workers.dev/upload/img", {
      method: "POST",
      body: formData,
    });
    
    if (!imgUploadResponse.ok) {
      const errorText = await imgUploadResponse.text();
      console.error('Image upload failed:', imgUploadResponse.status, errorText);
      throw new Error(`Image upload failed: ${imgUploadResponse.statusText}`);
    }
    
    const imgUri = await imgUploadResponse.text();
    console.log('Image URI:', imgUri);

    // Upload metadata with image URI
    console.log('Creating metadata...');
    const metadataBody = {
      createdOn: "https://bonk.fun",
      description: description,
      image: imgUri,
      name: tokenName,
      symbol: symbol,
      website: "http://runesol.fun/",
      twitter: "https://x.com/runesoldotfun"
    };
    
    console.log('Metadata body:', JSON.stringify(metadataBody, null, 2));
    
    const metadataResponse = await fetch("https://nft-storage.letsbonk22.workers.dev/upload/meta", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadataBody),
    });
    
    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error('Metadata upload failed:', metadataResponse.status, errorText);
      throw new Error(`Metadata upload failed: ${metadataResponse.statusText} - ${errorText}`);
    }
    
    const metadataUri = await metadataResponse.text();
    console.log('Metadata URI:', metadataUri);

    // Get the create transaction
    const pumpPortalAPIKey = Deno.env.get('PUMPPORTAL_API_KEY');
    if (!pumpPortalAPIKey) {
      throw new Error('PUMPPORTAL_API_KEY environment variable not set');
    }
    
    const requestBody = {
      action: "create",
      tokenMetadata: {
        name: tokenName,
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
    
    console.log('Creating token on LetsBonk...');
    
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
      
      // Extract the actual mint address from the response
      let actualMintAddress = mintPublicKey;
      if (data.mint) {
        actualMintAddress = data.mint;
      } else if (data.tokenAddress) {
        actualMintAddress = data.tokenAddress;
      }
      
      console.log("Transaction signature from API:", data.signature);
      console.log("Transaction: https://solscan.io/tx/" + data.signature);
      console.log("Token mint address:", actualMintAddress);
      
      // Update the user record with the token mint address and default market cap
      const { error: updateError } = await supabase
        .from('users')
        .update({
          mint_address: actualMintAddress,
          market_cap: 4200 // Default market cap of 4.2k
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update user with mint address:', updateError);
        // Don't throw here since the token was created successfully
      }

      // Generate the LetsBonk profile URL
      const letsBonkUrl = `https://letsbonk.fun/token/${actualMintAddress}`;

      // Insert into token_launches table with retry logic
      console.log('Attempting to insert token launch for user:', userId);
      
      // First try with all columns
      let insertData: any = {
        user_id: userId,
        username: username,
        token_name: tokenName,
        token_symbol: symbol,
        token_address: actualMintAddress,
        mint_address: actualMintAddress,
        market_cap: 4200
      };
      
      // Try adding optional columns one by one
      const optionalFields = {
        image_url: imageUrl,
        description: description,
        lets_bonk_url: letsBonkUrl,
        transaction_hash: data.signature
      };
      
      // First attempt with all fields
      console.log('Attempting insert with all fields...');
      let { data: launchData, error: launchError } = await supabase
        .from('token_launches')
        .insert({...insertData, ...optionalFields})
        .select()
        .single();
      
      // If it fails due to missing columns, try without optional fields
      if (launchError && launchError.code === 'PGRST204') {
        console.warn('Some columns missing, retrying with only required fields...');
        console.log('Missing column error:', launchError.message);
        
        const { data: retryData, error: retryError } = await supabase
          .from('token_launches')
          .insert(insertData)
          .select()
          .single();
          
        if (retryError) {
          console.error('Failed to insert token launch even with minimal fields:', retryError);
          console.error('Error details:', JSON.stringify(retryError, null, 2));
        } else {
          console.log('Token launch inserted successfully with minimal fields:', retryData);
          launchData = retryData;
          launchError = null;
        }
      } else if (launchError) {
        console.error('Failed to insert token launch:', launchError);
        console.error('Error details:', JSON.stringify(launchError, null, 2));
      } else {
        console.log('Token launch inserted successfully with all fields:', launchData);
      }

      return new Response(JSON.stringify({
        success: true,
        mintAddress: actualMintAddress,
        transactionSignature: data.signature,
        solscanUrl: `https://solscan.io/tx/${data.signature}`,
        letsBonkUrl: letsBonkUrl,
        marketCap: 4200
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('PumpPortal API error:', response.statusText);
      console.error('PumpPortal API response:', responseText);
      
      throw new Error(`PumpPortal API error: ${response.statusText} - ${responseText}`);
    }

  } catch (error) {
    console.error('Error in create-runescape-token function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create token' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});