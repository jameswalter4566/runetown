# Setting Up Environment Variables for Supabase Edge Functions

## Required Environment Variables

Your Edge Functions require the following environment variables:

1. **PUMPPORTAL_API_KEY** - For the `create-penguin-token` function
2. **SOLANA_TRACKER_KEY** - For both `create-penguin-token` and `update-token-data` functions
3. **SOLANA_TRACKER_PLAN** (optional) - For `update-token-data` function (values: free, starter, advanced, pro)

## How to Set Environment Variables in Supabase

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. Click on the function you want to configure (e.g., `create-penguin-token` or `update-token-data`)
4. Click on the **"Secrets"** tab
5. Add your environment variables:
   - Name: `PUMPPORTAL_API_KEY`
   - Value: `[Your PumpPortal API Key]`
   - Name: `SOLANA_TRACKER_KEY`
   - Value: `[Your Solana Tracker API Key]`
   - Name: `SOLANA_TRACKER_PLAN` (optional)
   - Value: `free` (or `starter`, `advanced`, `pro` based on your plan)

### Method 2: Using Supabase CLI

```bash
# Set environment variables for specific functions
supabase secrets set PUMPPORTAL_API_KEY="your-pumpportal-api-key"
supabase secrets set SOLANA_TRACKER_KEY="your-solana-tracker-api-key"
supabase secrets set SOLANA_TRACKER_PLAN="free"

# List all secrets to verify
supabase secrets list
```

### Method 3: Using .env.local file (for local development only)

Create a file called `.env.local` in your `supabase/functions` directory:

```
PUMPPORTAL_API_KEY=your-pumpportal-api-key
SOLANA_TRACKER_KEY=your-solana-tracker-api-key
SOLANA_TRACKER_PLAN=free
```

## Redeploying Functions After Setting Environment Variables

After setting the environment variables, you need to redeploy your functions:

### Using Supabase CLI:

```bash
# Deploy specific function
supabase functions deploy create-penguin-token
supabase functions deploy update-token-data

# Or deploy all functions
supabase functions deploy
```

### Using Dashboard:

1. Go to Edge Functions in your Supabase dashboard
2. Click on the function
3. Click "Deploy" or "Redeploy"

## Troubleshooting

1. **Environment variables not recognized after setting:**
   - Make sure you've redeployed the function after setting the variables
   - Check that the variable names match exactly (case-sensitive)
   - Verify the variables are set by checking the Secrets tab in the dashboard

2. **403 Forbidden errors:**
   - Verify your API keys are valid and not expired
   - Check that the API keys have the necessary permissions
   - Ensure you're not exceeding rate limits

3. **Functions still using old environment variables:**
   - Clear any function cache by redeploying
   - Wait a few minutes for changes to propagate
   - Check function logs for the most recent deployment

## Important Note

The fix I applied corrected this line in `update-token-data/index.ts`:
```typescript
// Was incorrectly:
const solanaTrackerKey = Deno.env.get('fe0334b7-529a-4711-91a0-77764b1b5af7')

// Now correctly:
const solanaTrackerKey = Deno.env.get('SOLANA_TRACKER_KEY')
```

Make sure to redeploy the `update-token-data` function after this fix!