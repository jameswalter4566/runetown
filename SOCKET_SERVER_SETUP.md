# Socket.io Server Setup Guide

This guide will help you set up a dedicated Socket.io server for low-latency multiplayer while keeping Supabase for authentication and chat.

## Quick Local Setup (For Testing)

1. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   # Or for development with auto-restart:
   npm run dev
   ```

3. **The server will run on port 3001**
   - Health check: http://localhost:3001/health

## Deploy to Production (3 Options)

### Option 1: Deploy to Render (Free)

1. **Create account at [render.com](https://render.com)**

2. **Fork/push your code to GitHub**

3. **Create new Web Service on Render:**
   - Connect your GitHub repo
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
   - Instance Type: Free

4. **After deploy, get your server URL** (e.g., `https://your-game-server.onrender.com`)

### Option 2: Deploy to Railway (Easier, $5/month)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy:**
   ```bash
   cd server
   railway login
   railway init
   railway up
   ```

3. **Get your server URL from Railway dashboard**

### Option 3: Deploy to a VPS (Best Performance)

1. **Get a VPS from DigitalOcean/Linode/Vultr** ($5-10/month)

2. **SSH into your server and install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone your repo and install:**
   ```bash
   git clone your-repo-url
   cd your-repo/server
   npm install
   ```

4. **Install PM2 for process management:**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```

5. **Set up Nginx reverse proxy:**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/game-server
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/game-server /etc/nginx/sites-enabled
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Configure Your Game

1. **Add Environment Variable in Supabase Dashboard:**
   - Go to your Supabase project settings
   - Navigate to "Edge Functions" → "Secrets"
   - Add a new environment variable:
     - **Key:** `SOCKET_SERVER_URL`
     - **Value:** `https://your-socket-server.com`
   
   OR if using Vercel/Netlify:
   - Add environment variable in your deployment settings:
     - **Key:** `SOCKET_SERVER_URL`
     - **Value:** `https://your-socket-server.com`

2. **The game automatically uses Socket.io when available:**
   - Falls back to `http://localhost:3001` for local development
   - Supabase still handles auth and chat

## Update Your Game Code

In `ClubPenguinGame.tsx`, replace the multiplayer hook:

```typescript
// Replace this:
import { useMultiplayerImproved } from '@/hooks/useMultiplayerImproved';

// With this:
import { useSocketMultiplayer } from '@/hooks/useSocketMultiplayer';

// Then update the hook usage:
const {
  processMovementInput,
  getLocalPlayerPosition,
  getOtherPlayers,
  isConnected,
  latency
} = useSocketMultiplayer({
  username,
  modelFile: penguinModel,
  currentMap,
  isSignedIn,
  initialPosition
});
```

## Testing

1. **Check server health:**
   ```bash
   curl https://your-server-url.com/health
   ```

2. **Monitor latency in-game:**
   - The `latency` value shows round-trip time in milliseconds
   - Should be <50ms for good experience
   - Will be much better than Supabase!

## Security Notes

1. **Add authentication** (optional but recommended):
   - Verify Supabase JWT tokens on Socket.io connection
   - Prevent unauthorized players

2. **Rate limiting:**
   - The server limits updates to prevent spam
   - Adjust in `server.js` if needed

3. **CORS settings:**
   - Update allowed origins in `server.js`
   - Add your production domain

## Monitoring

- Server logs will show connections/disconnections
- Health endpoint shows active players and rooms
- Use PM2 logs: `pm2 logs` (if using PM2)

That's it! Your game now has a dedicated low-latency multiplayer server.