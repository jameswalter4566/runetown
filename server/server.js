const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow all origins in development, be more restrictive in production
      console.log('CORS request from origin:', origin);
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["content-type"]
  },
  // Allow both websocket and polling transports
  transports: ['websocket', 'polling'],
  // Increase timeouts for better stability
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store active players by room
const rooms = new Map();

// Simple physics update function
function updatePlayerPhysics(player, targetPosition, deltaTime) {
  const speed = 5; // units per second
  const dx = targetPosition.x - player.position.x;
  const dz = targetPosition.z - player.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  if (distance > 0.1) {
    // Move towards target
    const moveDistance = Math.min(speed * deltaTime, distance);
    const ratio = moveDistance / distance;
    
    player.position.x += dx * ratio;
    player.position.z += dz * ratio;
    player.position.y = 0; // Keep Y at 0 for consistent rendering
    player.direction = Math.atan2(dx, dz);
    player.isMoving = true;
    player.isMovingAnim = true;
    player.animPhase = Date.now() * 0.008;
    player.velocity = { x: dx * ratio / deltaTime, y: 0, z: dz * ratio / deltaTime };
  } else {
    // Reached target
    player.isMoving = false;
    player.isMovingAnim = false;
    player.velocity = { x: 0, y: 0, z: 0 };
  }
  
  return player;
}

// Physics update loop - runs at 60 FPS
setInterval(() => {
  const deltaTime = 0.016; // 60 FPS
  
  rooms.forEach((room, roomName) => {
    let hasUpdates = false;
    
    room.players.forEach((player, id) => {
      if (player.targetPosition) {
        updatePlayerPhysics(player, player.targetPosition, deltaTime);
        hasUpdates = true;
      }
    });
    
    // Broadcast updated state to all players in room if there were changes
    if (hasUpdates) {
      const playersArray = Array.from(room.players.values());
      io.to(roomName).emit('room-state', playersArray);
    }
  });
}, 16); // 60 FPS

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.json({ 
    message: 'RuneTown Game Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      websocket: 'ws://' + req.get('host')
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    players: Array.from(rooms.values()).reduce((sum, room) => sum + room.players.size, 0),
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

// Log Socket.IO configuration
console.log('Socket.IO server configured with:');
console.log('- CORS: Allowing all origins');
console.log('- Transports: websocket, polling');

io.on('connection', (socket) => {
  console.log('\n✅ New player connected!');
  console.log('- Socket ID:', socket.id);
  console.log('- Transport:', socket.conn.transport.name);
  console.log('- IP:', socket.handshake.address);
  console.log('- Auth:', socket.handshake.auth);
  console.log('- Query:', socket.handshake.query);
  
  let currentRoom = null;
  let playerId = null;

  // Join a game room
  socket.on('join-room', (data) => {
    const { roomName, player } = data;
    
    // Leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      const room = rooms.get(currentRoom);
      if (room) {
        room.players.delete(playerId);
        socket.to(currentRoom).emit('player-left', playerId);
        
        // Clean up empty rooms
        if (room.players.size === 0) {
          rooms.delete(currentRoom);
        }
      }
    }

    // Join new room
    currentRoom = roomName;
    playerId = player.id;
    socket.join(roomName);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomName)) {
      rooms.set(roomName, {
        players: new Map(),
        lastUpdate: Date.now()
      });
    }

    const room = rooms.get(roomName);
    room.players.set(playerId, {
      ...player,
      socketId: socket.id,
      lastUpdate: Date.now()
    });

    // Send full room state to ALL players in the room
    const allPlayers = Array.from(room.players.values());
    io.to(roomName).emit('room-state', allPlayers);
    
    console.log(`Player ${player.username} joined room ${roomName}`);
  });

  // Handle movement request (server-authoritative)
  socket.on('request-move', (data) => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (room && room.players.has(playerId)) {
      const player = room.players.get(playerId);
      // Set target position for physics to handle
      player.targetPosition = data.targetPosition;
      console.log(`Player ${playerId} requested move to:`, data.targetPosition);
    }
  });

  // Handle player movement (DEPRECATED - keeping for backward compatibility)
  socket.on('player-move', (data) => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (room && room.players.has(playerId)) {
      // Update player state
      const player = room.players.get(playerId);
      room.players.set(playerId, {
        ...player,
        ...data,
        lastUpdate: Date.now()
      });

      // Broadcast to other players in the room (ensure all fields are included)
      socket.to(currentRoom).emit('player-moved', {
        id: playerId,
        position: data.position || player.position,
        velocity: data.velocity || player.velocity,
        direction: data.direction !== undefined ? data.direction : player.direction,
        username: data.username || player.username,
        modelFile: data.modelFile || player.modelFile,
        isMoving: data.isMoving !== undefined ? data.isMoving : player.isMoving,
        isMovingAnim: data.isMovingAnim !== undefined ? data.isMovingAnim : player.isMovingAnim,
        animPhase: data.animPhase !== undefined ? data.animPhase : player.animPhase,
        userId: data.userId || player.userId
      });
    }
  });

  // Handle player state updates (for things like chat messages, emotes, etc)
  socket.on('player-state', (data) => {
    if (!currentRoom || !playerId) return;

    socket.to(currentRoom).emit('player-state-update', {
      id: playerId,
      ...data
    });
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    if (!currentRoom || !playerId) return;
    
    console.log(`[CHAT] Message from ${playerId}: ${data.message}`);
    
    const timestamp = data.timestamp || Date.now();
    
    // Update player state with chat message
    const room = rooms.get(currentRoom);
    if (room && room.players.has(playerId)) {
      const player = room.players.get(playerId);
      room.players.set(playerId, {
        ...player,
        chatMessage: data.message,
        chatMessageTime: timestamp
      });
    }
    
    // Broadcast to all players in the room INCLUDING the sender
    io.to(currentRoom).emit('player-chat', {
      id: playerId,
      message: data.message,
      timestamp: timestamp
    });
    
    // Also broadcast updated player state with chat
    const player = room.players.get(playerId);
    if (player) {
      io.to(currentRoom).emit('player-update', {
        id: playerId,
        ...player,
        chatMessage: data.message,
        chatMessageTime: timestamp
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('\n🔌 Player disconnected!');
    console.log('- Socket ID:', socket.id);
    console.log('- Reason:', reason);
    
    if (currentRoom && playerId) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.players.delete(playerId);
        
        // Broadcast updated room state to all remaining players
        const allPlayers = Array.from(room.players.values());
        io.to(currentRoom).emit('room-state', allPlayers);
        
        // Clean up empty rooms
        if (room.players.size === 0) {
          rooms.delete(currentRoom);
          console.log(`Room ${currentRoom} deleted (empty)`);
        }
      }
    }
  });

  // Ping/pong for latency measurement
  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });
});

// Clean up stale rooms periodically
setInterval(() => {
  const now = Date.now();
  const staleTimeout = 5 * 60 * 1000; // 5 minutes

  for (const [roomName, room] of rooms.entries()) {
    if (room.players.size === 0 && now - room.lastUpdate > staleTimeout) {
      rooms.delete(roomName);
      console.log(`Cleaned up stale room: ${roomName}`);
    }
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('\n======================================');
  console.log('🎮 RuneTown Game Server Started!');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log('📡 WebSocket endpoint: ws://localhost:' + PORT);
  console.log('======================================\n');
});