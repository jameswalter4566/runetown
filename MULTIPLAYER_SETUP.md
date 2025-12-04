# Multiplayer Setup Guide

## Overview
The game now supports real-time multiplayer functionality using Supabase Realtime channels. Players can see each other move, interact, and battle in real-time.

## Features
- **Real-time player synchronization**: All player movements and actions are synchronized across clients
- **Presence system**: See who's online and in your game room
- **Smooth interpolation**: Player movements are interpolated for smooth visual experience
- **Room-based gameplay**: Separate rooms for spawn and territory areas
- **Player indicators**: Name labels and health bars above other players
- **Minimap integration**: See all players on the minimap

## How It Works

### Architecture
1. **Supabase Realtime Channels**: Used for real-time communication between players
2. **Presence Tracking**: Tracks which players are in each room
3. **Broadcast Events**: Sends player updates and game events to all players
4. **Client-side Prediction**: Local player moves immediately, then syncs with server
5. **Interpolation**: Other players' movements are smoothly interpolated

### Key Components

#### useMultiplayer Hook
- Manages connection to Supabase Realtime
- Handles player presence and updates
- Broadcasts local player state
- Receives and processes other players' states

#### OtherPlayer Component
- Renders other players in the game world
- Handles smooth interpolation of position and rotation
- Displays player names and health bars
- Uses the same character models as local players

#### Battlefield3DMultiplayer
- Extended version of Battlefield3D with multiplayer support
- Integrates the useMultiplayer hook
- Renders all connected players
- Shows connection status in the HUD

## Setup Instructions

### 1. Supabase Configuration
The game is already configured to use Supabase. The credentials are in:
```
src/integrations/supabase/client.ts
```

### 2. Running Multiplayer
1. Start the development server: `npm run dev`
2. Open multiple browser windows/tabs
3. Create different characters in each window
4. Players will automatically see each other when in the same room

### 3. Testing Locally
- Open the game in multiple browser tabs
- Create characters with different names
- Move around and observe real-time synchronization
- Check the online player count in the HUD

## Technical Details

### Update Rate
- Position updates: 30 times per second (throttled)
- Smooth interpolation between updates
- Optimized for minimal bandwidth usage

### State Synchronization
```typescript
interface PlayerState {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  faction: string;
  health: number;
  isMoving: boolean;
  lastUpdate: number;
  screenName: string;
}
```

### Room System
- `spawn-main`: The spawn room where players start
- `territory-main`: The main battlefield area
- Players only see others in the same room

## Performance Considerations
- Position updates are throttled to 30 FPS
- Only essential data is synchronized
- Interpolation reduces the need for high-frequency updates
- Supabase handles connection pooling and scaling

## Future Enhancements
1. **Combat Synchronization**: Sync arrow shots and damage
2. **Chat System**: Add in-game chat functionality
3. **Matchmaking**: Create private rooms for groups
4. **Lag Compensation**: Implement server reconciliation
5. **Regional Servers**: Support for different regions

## Troubleshooting
- If players don't see each other, check browser console for connection errors
- Ensure all players are in the same room (spawn or territory)
- Check that Supabase credentials are properly configured
- Verify that websocket connections are not blocked by firewalls