# Deploying RuneTown Multiplayer to Render

## Prerequisites
- A Render account (https://render.com)
- Your RuneTown repository pushed to GitHub

## Deployment Steps

### 1. Deploy the WebSocket Server

1. Go to your Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `runetown-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or your preferred tier)

5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render's default)

6. Click "Create Web Service"

### 2. Update Your Frontend

1. Once your server is deployed, copy its URL (e.g., `https://runetown-server.onrender.com`)

2. In your frontend deployment platform (Netlify/Vercel), add this environment variable:
   ```
   VITE_SOCKET_SERVER_URL=https://runetown-server.onrender.com
   ```

3. Redeploy your frontend

### 3. Testing Multiplayer

1. Open multiple browser windows/tabs with your game
2. Log in with different characters
3. You should see other players moving in real-time!

## Alternative: Using render.yaml

You can also deploy using the included `render.yaml` file:

1. Push your code to GitHub
2. In Render Dashboard, click "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to deploy all services

## Troubleshooting

### Server not connecting
- Check that the WebSocket server URL is correct in your environment variables
- Ensure CORS is properly configured (already set up in server.js)
- Check Render logs for any errors

### High latency
- Consider upgrading to a paid Render plan for better performance
- Deploy in a region closer to your users

### WebSocket connection issues
- Render supports WebSockets on all plans
- Make sure you're using `wss://` (secure WebSocket) in production