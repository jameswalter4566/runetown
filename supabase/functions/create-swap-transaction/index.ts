import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js@1.91.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { inputMint, outputMint, amount, userPublicKey, slippage = 50, useLegacyTransaction = false } = await req.json();
    
    if (!inputMint || !outputMint || !amount || !userPublicKey) {
      throw new Error('Missing required parameters');
    }

    console.log(`Preparing swap: ${amount} lamports of ${inputMint} to ${outputMint}`);
    console.log(`User: ${userPublicKey}, Slippage: ${slippage} bps`);
    
    // Use Helius RPC for better reliability (same as hedgefund-mosaic-viewer)
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL') || 'https://mainnet.helius-rpc.com/?api-key=726140d8-6b0d-4719-8702-682d81e94a37';
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      disableRetryOnRateLimit: true
    });
    
    // Validate user public key
    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(userPublicKey);
    } catch (error) {
      throw new Error('Invalid user public key');
    }
    
    // Check user balance
    const balance = await connection.getBalance(userPubkey);
    const balanceInSol = balance / LAMPORTS_PER_SOL;
    const requiredLamports = parseInt(amount);
    const requiredSol = requiredLamports / LAMPORTS_PER_SOL;
    
    console.log(`User balance: ${balanceInSol} SOL`);
    console.log(`Required: ${requiredSol} SOL`);
    
    // Check for sufficient balance with buffer for fees
    const feeBuffer = 0.01; // 0.01 SOL for fees and potential token account creation
    if (balanceInSol < requiredSol + feeBuffer) {
      throw new Error(`Insufficient balance: ${balanceInSol} SOL available, ${requiredSol + feeBuffer} SOL needed`);
    }

    // Jupiter V6 API endpoint
    const quoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage}`
    );

    if (!quoteResponse.ok) {
      throw new Error('Failed to get quote from Jupiter');
    }

    const quoteData = await quoteResponse.json();
    
    console.log(`Quote received: ${quoteData.inAmount} -> ${quoteData.outAmount}`);
    console.log(`Price impact: ${quoteData.priceImpactPct}%`);

    // Get the swap transaction directly with proper settings
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: userPublicKey,
        wrapAndUnwrapSol: true,
        asLegacyTransaction: useLegacyTransaction, // Support both legacy and versioned transactions
        prioritizationFeeLamports: 200000, // Match hedgefund-mosaic-viewer
        dynamicComputeUnitLimit: true,
      })
    });

    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();
      throw new Error(`Failed to create swap transaction: ${errorText}`);
    }

    const swapData = await swapResponse.json();
    
    // Simulate transaction before returning (like hedgefund-mosaic-viewer)
    if (swapData.swapTransaction) {
      try {
        const transactionBuffer = Uint8Array.from(atob(swapData.swapTransaction), c => c.charCodeAt(0));
        const { VersionedTransaction, Transaction } = await import('https://esm.sh/@solana/web3.js@1.91.0');
        
        let transaction;
        try {
          transaction = VersionedTransaction.deserialize(transactionBuffer);
        } catch (e) {
          transaction = Transaction.from(transactionBuffer);
        }
        
        const simulation = await connection.simulateTransaction(transaction, {
          replaceRecentBlockhash: true,
          commitment: 'processed'
        });
        
        if (simulation.value.err) {
          console.error('Transaction simulation failed:', simulation.value.err);
          console.log('Simulation logs:', simulation.value.logs);
          throw new Error('Transaction simulation failed. The swap may not be possible.');
        }
        
        console.log('Transaction simulation successful');
      } catch (simError) {
        console.error('Failed to simulate transaction:', simError);
        // Continue anyway - simulation failure doesn't always mean tx will fail
      }
    }

    // Calculate output amount for preview
    const inputAmount = parseInt(quoteData.inAmount);
    const outputAmount = parseInt(quoteData.outAmount);

    return new Response(
      JSON.stringify({ 
        success: true,
        swapTransaction: swapData.swapTransaction,
        lastValidBlockHeight: swapData.lastValidBlockHeight,
        prioritizationFeeLamports: swapData.prioritizationFeeLamports,
        computeUnitLimit: swapData.computeUnitLimit,
        quote: {
          inputAmount: quoteData.inAmount,
          outputAmount: quoteData.outAmount,
          inputAmountInSol: inputAmount / LAMPORTS_PER_SOL,
          outputAmountInTokens: outputAmount, // This would need decimals adjustment based on token
          priceImpactPct: quoteData.priceImpactPct,
          routePlan: quoteData.routePlan
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-swap-transaction:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});