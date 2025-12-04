# Multiplayer Performance Optimization Guide

## Current Issues
- High latency when players are on different networks
- Frequent disconnections and reconnections
- Movement appears delayed/glitchy for remote players

## Solutions Implemented

### 1. Reduced Update Frequency
- Changed from 20Hz (50ms) to 10Hz (100ms) updates
- This reduces network traffic by 50%

### 2. Connection Stability
- Added exponential backoff for reconnections
- Limited reconnection attempts to prevent spam
- Added connection status logging

### 3. Presence Update Throttling
- Presence updates now only sent once per second
- Prevents overwhelming the Supabase Realtime service

## For Better Performance

### Option 1: Use a Different Region
If your friends are geographically distant, consider:
1. Check your Supabase project region in the dashboard
2. Create a new project in a more central region
3. Update your `.env.local` with new credentials

### Option 2: Use a Dedicated Game Server
For production-level performance, consider:
1. **Colyseus** - Open source multiplayer game server
2. **Photon Fusion** - Unity-based but has web SDK
3. **Socket.io** with a dedicated server
4. **WebRTC** for peer-to-peer connections

### Option 3: Optimize Current Setup
1. Enable Supabase connection pooling
2. Use edge functions for server-side validation
3. Implement client-side prediction more aggressively

## Quick Fixes to Try

1. **Increase the update interval** in `useMultiplayerImproved.ts`:
   ```typescript
   // Change from 100ms to 200ms
   if (now % 200 < deltaTime * 1000) {
     sendStateUpdate();
   }
   ```

2. **Add connection quality monitoring**:
   - Measure round-trip time
   - Adjust update frequency based on latency
   - Show connection status to players

3. **Batch updates**:
   - Collect multiple state changes
   - Send them together every 200-500ms

## Testing Locally
To test if it's a network issue:
1. Run `npm run dev`
2. Open multiple browsers on same machine
3. If smooth locally but not remotely, it's network latency

## Recommended Next Steps
For a production game with global players, consider migrating to a dedicated multiplayer service like Colyseus or implementing WebRTC for peer-to-peer connections.