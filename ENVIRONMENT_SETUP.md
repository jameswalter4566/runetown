# Environment Variable Setup

## For Netlify

1. **Go to your Netlify dashboard**
2. **Select your site**
3. **Go to Site Settings → Environment Variables**
4. **Add new variable:**
   - **Key:** `VITE_SOCKET_SERVER_URL`
   - **Value:** `https://fantasy-map-sketchpad-68.onrender.com`
5. **Save and redeploy**

## For Vercel

1. **Go to your Vercel dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add new variable:**
   - **Name:** `VITE_SOCKET_SERVER_URL`
   - **Value:** `https://fantasy-map-sketchpad-68.onrender.com`
   - **Environment:** Production (check all boxes)
5. **Save and redeploy**

## For Local Development

Create a `.env.local` file in your project root:
```
VITE_SOCKET_SERVER_URL=http://localhost:3001
```

## For Other Platforms

Most deployment platforms support environment variables. Add:
- **Variable name:** `VITE_SOCKET_SERVER_URL`
- **Value:** Your Socket.io server URL

Note: The `VITE_` prefix is required for Vite to expose the variable to your app.

## Testing

After setting the environment variable and redeploying:
1. Open your game
2. Check the connection status (should show "Connected")
3. Verify the latency is low
4. Test multiplayer with another browser/device