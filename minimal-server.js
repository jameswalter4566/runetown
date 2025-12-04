// Minimal WebSocket server for RuneTown
// You can copy this to any Node.js repository

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const players = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', players: players.size });
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomName, player }) => {
    socket.join(roomName);
    players.set(player.id, player);
    socket.to(roomName).emit('player-joined', player);
  });
  
  socket.on('player-move', (data) => {
    socket.to('game-map:grandexchange').emit('player-moved', data);
  });
  
  socket.on('disconnect', () => {
    // Clean up
  });
});

server.listen(process.env.PORT || 10000);