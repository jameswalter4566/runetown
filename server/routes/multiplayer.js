import express from 'express';
import { Server } from 'socket.io';

const router = express.Router();

// Store active players and their positions
const activePlayers = new Map();
const playerSockets = new Map();

// Initialize Socket.IO for real-time updates
export function initializeMultiplayer(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Multiplayer] Player connected: ${socket.id}`);

    socket.on('player-join', (data) => {
      const { playerId, username, position, modelType } = data;
      
      // Store player data
      activePlayers.set(playerId, {
        id: playerId,
        username,
        position,
        modelType,
        socketId: socket.id,
        lastUpdate: Date.now()
      });
      
      playerSockets.set(socket.id, playerId);
      
      // Send current players to new player
      socket.emit('players-list', Array.from(activePlayers.values()));
      
      // Notify other players
      socket.broadcast.emit('player-joined', {
        id: playerId,
        username,
        position,
        modelType
      });
      
      console.log(`[Multiplayer] Player ${username} joined. Total players: ${activePlayers.size}`);
    });

    socket.on('player-move', (data) => {
      const { playerId, position, targetPosition, direction, isMoving } = data;
      
      const player = activePlayers.get(playerId);
      if (player) {
        player.position = position;
        player.targetPosition = targetPosition;
        player.direction = direction;
        player.isMoving = isMoving;
        player.lastUpdate = Date.now();
        
        // Broadcast to other players
        socket.broadcast.emit('player-moved', {
          id: playerId,
          position,
          targetPosition,
          direction,
          isMoving
        });
      }
    });

    socket.on('player-position-update', (data) => {
      const { playerId, position, direction } = data;
      
      const player = activePlayers.get(playerId);
      if (player) {
        player.position = position;
        player.direction = direction;
        player.lastUpdate = Date.now();
        
        // Broadcast intermediate position to other players
        socket.broadcast.emit('player-position', {
          id: playerId,
          position,
          direction
        });
      }
    });

    socket.on('disconnect', () => {
      const playerId = playerSockets.get(socket.id);
      if (playerId) {
        const player = activePlayers.get(playerId);
        if (player) {
          console.log(`[Multiplayer] Player ${player.username} disconnected`);
          activePlayers.delete(playerId);
          playerSockets.delete(socket.id);
          
          // Notify other players
          io.emit('player-left', { id: playerId });
        }
      }
    });
  });

  // Clean up stale connections every 30 seconds
  setInterval(() => {
    const now = Date.now();
    const staleTimeout = 60000; // 1 minute
    
    activePlayers.forEach((player, playerId) => {
      if (now - player.lastUpdate > staleTimeout) {
        console.log(`[Multiplayer] Removing stale player: ${player.username}`);
        activePlayers.delete(playerId);
        io.emit('player-left', { id: playerId });
      }
    });
  }, 30000);
}

// REST endpoints for multiplayer info
router.get('/players', (req, res) => {
  const players = Array.from(activePlayers.values()).map(player => ({
    id: player.id,
    username: player.username,
    position: player.position,
    modelType: player.modelType
  }));
  
  res.json({
    count: players.length,
    players
  });
});

router.get('/player-count', (req, res) => {
  res.json({ count: activePlayers.size });
});

export default router;