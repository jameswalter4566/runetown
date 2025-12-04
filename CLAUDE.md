# Claude Code Context

## Project Overview
RuneTown - A RuneScape-inspired multiplayer web game with real-time player interactions.

## Multiplayer Position System

### Database Schema
The `player_positions` table tracks player movements with the following fields:

#### Coordinate Fields
- **`x`, `y`** - The DESTINATION coordinates where the player clicked to move to
- **`source_x`, `source_y`** - The player's position when they clicked (where they started moving from)

**IMPORTANT**: In the database, `x` and `y` represent the DESTINATION, while in the code's `sendMovement()` function, the parameters are ordered as:
```typescript
sendMovement(sourceX, sourceY, destX, destY, direction)
//           ^^^^^^^^^^^^^^   ^^^^^^^^^^^^^
//           current pos      clicked pos
```

This means:
- Database `x, y` = Code's `destX, destY`
- Database `source_x, source_y` = Code's `sourceX, sourceY`

#### Other Fields
- **`player_id`** - Unique identifier for the player
- **`direction`** - Cardinal direction (N, NE, E, SE, S, SW, W, NW)
- **`timestamp`** - When the movement was initiated
- **`model_type`** - Which character model the player is using
- **`screen_name`** - Player's display name

### Movement Flow
1. Player clicks on ground at position (50, 80)
2. Player is currently at position (-80, 0)
3. System stores:
   - `source_x: -80, source_y: 0` (where player was)
   - `x: 50, y: 80` (where player is going)
4. Other clients can interpolate movement from source to destination based on timestamp

### Fixed Velocity
- Movement speed: 0.15 units per frame (approximately 9 units/second at 60fps)
- All players move at the same speed
- Interpolation can be calculated client-side using: `position = source + (destination - source) * progress`

## Key Architecture Decisions
- Insert-only pattern (no updates) to avoid conflicts
- Source position tracking enables accurate interpolation
- Real-time updates via Supabase WebSocket subscriptions
- Position history maintained for 5 minutes then cleaned up