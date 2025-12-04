#!/bin/bash

# Deploy wallet generation edge function to Supabase
echo "Deploying generate-wallet edge function..."

# Make sure you have Supabase CLI installed and are logged in
# Install: npm install -g supabase

# Deploy the edge function
supabase functions deploy generate-wallet

# Set the necessary environment variables (if not already set)
# You'll need to set these in your Supabase dashboard under Edge Functions > Settings
echo ""
echo "Make sure to set these environment variables in your Supabase dashboard:"
echo "- SUPABASE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "Edge function deployed successfully!"
echo "Function URL: https://your-project-ref.supabase.co/functions/v1/generate-wallet"