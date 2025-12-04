#!/bin/bash

# Deploy the create-swap-transaction edge function to Supabase

echo "Deploying create-swap-transaction edge function..."

# Deploy the function
npx supabase functions deploy create-swap-transaction

echo "Deployment complete!"
echo ""
echo "Note: If you want to use a custom Helius RPC endpoint, set the SOLANA_RPC_URL secret:"
echo "npx supabase secrets set SOLANA_RPC_URL='https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY'"