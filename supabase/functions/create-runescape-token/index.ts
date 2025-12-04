import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Keypair, VersionedTransaction, Connection } from 'https://esm.sh/@solana/web3.js@1.98.2';
import bs58 from "https://esm.sh/bs58@6.0.0";

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
    const mintPublicKey = mintKeypair.publicKey.toBase58();
    
    console.log('Generated unique token mint address:', mintPublicKey);

    // Fetch the RuneScape logo and convert to blob
    console.log('Fetching RuneScape logo...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageUint8Array = new Uint8Array(imageArrayBuffer);
    
    const imageBlob = new Blob([imageUint8Array], { type: 'image/jpeg' });

    // Build metadata on Pump.fun IPFS endpoint
    const metadataForm = new FormData();
    metadataForm.append("file", imageBlob, "runescapelogo.jpg");
    metadataForm.append("name", tokenName);
    metadataForm.append("symbol", symbol);
    metadataForm.append("description", description);
    metadataForm.append("twitter", "https://x.com/runescapewtf");
    metadataForm.append("telegram", "");
    metadataForm.append("website", "http://runescape.wtf/");
    metadataForm.append("showName", "true");

    const metadataResponse = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: metadataForm,
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      throw new Error(`Pump.fun IPFS upload failed (${metadataResponse.status}): ${errorText}`);
    }

    const metadataJson = await metadataResponse.json();
    const metadataUri = metadataJson?.metadataUri || metadataJson?.metadata_uri;
    const imageFromMetadata = metadataJson?.metadata?.image || metadataJson?.image || imageUrl;

    // Prepare signer
    const solanaPrivateKey = Deno.env.get('solana_key') || Deno.env.get('SOLANA_KEY');
    if (!solanaPrivateKey) {
      throw new Error('solana_key env variable not set');
    }
    const signerKeyPair = Keypair.fromSecretKey(bs58.decode(solanaPrivateKey));
    const publicKey = signerKeyPair.publicKey.toBase58();
    
    console.log('Using PumpPortal trade-local with signer:', publicKey);

    // Get the create transaction from PumpPortal
    const pumpResponse = await fetch(`https://pumpportal.fun/api/trade-local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicKey: publicKey,
        action: "create",
        tokenMetadata: {
          name: tokenName,
          symbol: symbol,
          uri: metadataUri,
        },
        mint: mintKeypair.publicKey.toBase58(),
        denominatedInSol: "true",
        amount: 0.001,
        slippage: 10,
        priorityFee: 0.00001,
        pool: "pump",
      }),
    });

    console.log('PumpPortal API response status:', pumpResponse.status);
    if (pumpResponse.status === 200) {
      const data = await pumpResponse.arrayBuffer();
      const tx = VersionedTransaction.deserialize(new Uint8Array(data));
      tx.sign([mintKeypair, signerKeyPair]);

      const connection = new Connection('https://api.mainnet-beta.solana.com/', 'confirmed');
      const signature = await connection.sendTransaction(tx);
      const actualMintAddress = mintKeypair.publicKey.toBase58();

      console.log("Transaction: https://solscan.io/tx/" + signature);
      console.log("Token mint address:", actualMintAddress);
      
      // Update the user record with the token mint address and default market cap
      const { error: updateError } = await supabase
        .from('users')
        .update({
          mint_address: actualMintAddress,
          token_mint_address: actualMintAddress,
          market_cap: 4200 // Default market cap of 4.2k
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update user with mint address:', updateError);
        // Don't throw here since the token was created successfully
      }

      // Generate the Pump.fun profile URL
      const pumpFunUrl = `https://pump.fun/coin/${actualMintAddress}`;

      // Insert into token_launches table with retry logic
      console.log('Attempting to insert token launch for user:', userId);
      
      // First try with all columns
      // Insert into token_launches
      const { error: launchError } = await supabase
        .from('token_launches')
        .insert({
          user_id: userId,
          username: username,
          token_name: tokenName,
          token_symbol: symbol,
          token_address: actualMintAddress,
          mint_address: actualMintAddress,
          image_url: imageFromMetadata,
          description: description,
          lets_bonk_url: pumpFunUrl,
          transaction_hash: signature,
          market_cap: 4200
        });
      
      if (launchError) {
        console.error('Failed to insert token launch:', launchError);
      }

      return new Response(JSON.stringify({
        success: true,
        mintAddress: actualMintAddress,
        transactionSignature: signature,
        solscanUrl: `https://solscan.io/tx/${signature}`,
        pumpFunUrl,
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
