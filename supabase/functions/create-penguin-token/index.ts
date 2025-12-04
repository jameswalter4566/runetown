import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const mintPublicKey = mintKeypair.publicKey.toBase58();
    
    console.log('Generated unique token mint address:', mintPublicKey);

    // Upload penguin image to Pump.fun IPFS
    console.log('Uploading penguin image to Pump.fun IPFS...');
    const formData = new FormData();
    const blob = new Blob([Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))], { type: 'image/png' });
    formData.append("file", blob, "token.png");
    formData.append("name", name);
    formData.append("symbol", symbol);
    formData.append("description", description);
    formData.append("twitter", "https://x.com/clubpenguin_fun");
    formData.append("telegram", "");
    formData.append("website", "https://clubpenguin.fun/");
    formData.append("showName", "true");

    const metadataResponse = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: formData,
    });
    
    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error('Metadata upload failed:', metadataResponse.status, errorText);
      throw new Error(`Pump.fun IPFS upload failed: ${metadataResponse.statusText} - ${errorText}`);
    }
    
    const metadataJson = await metadataResponse.json();
    const metadataUri = metadataJson?.metadataUri || metadataJson?.metadata_uri;
    const imageFromMetadata = metadataJson?.metadata?.image || metadataJson?.image || undefined;

    // Prepare signer
    const solanaPrivateKey = Deno.env.get('solana_key') || Deno.env.get('SOLANA_KEY');
    if (!solanaPrivateKey) {
      throw new Error('solana_key env variable not set');
    }
    const signerKeyPair = Keypair.fromSecretKey(bs58.decode(solanaPrivateKey));
    const publicKey = signerKeyPair.publicKey.toBase58();
    
    console.log('Using PumpPortal trade-local with signer:', publicKey);

    const response = await fetch(
      `https://pumpportal.fun/api/trade-local`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey: publicKey,
          action: "create",
          tokenMetadata: {
            name: name,
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
      }
    );

    console.log('PumpPortal response status:', response.status);
    
    if (response.status === 200) {
      const data = await response.arrayBuffer();
      const tx = VersionedTransaction.deserialize(new Uint8Array(data));
      tx.sign([mintKeypair, signerKeyPair]);

      const connection = new Connection('https://api.mainnet-beta.solana.com/', 'confirmed');
      const signature = await connection.sendTransaction(tx);
      const actualMintAddress = mintKeypair.publicKey.toBase58();

      console.log("Transaction: https://solscan.io/tx/" + signature);
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
        transactionSignature: signature,
        solscanUrl: `https://solscan.io/tx/${signature}`,
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
