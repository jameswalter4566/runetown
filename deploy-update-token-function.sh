#!/bin/bash

# Deploy the update-token-data function
supabase functions deploy update-token-data --no-verify-jwt

echo "update-token-data function deployed successfully!"
echo ""
echo "To set up a cron job in Supabase:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to Edge Functions"
echo "3. Find 'update-token-data' function"
echo "4. Set up a cron trigger (e.g., every 5 minutes: */5 * * * *)"
echo ""
echo "Make sure to set the SOLANA_TRACKER_KEY environment variable in Supabase dashboard!"