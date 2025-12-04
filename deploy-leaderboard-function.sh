#!/bin/bash

# Deploy leaderboard functions to Supabase
echo "Deploying leaderboard edge functions..."

# Deploy the submit-score function
supabase functions deploy submit-score

echo ""
echo "Leaderboard functions deployed successfully!"
echo "Function URLs:"
echo "- Submit Score: https://your-project-ref.supabase.co/functions/v1/submit-score"
echo ""
echo "Don't forget to run the database migration:"
echo "supabase db push"