import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDatabaseMultiplayer } from './useDatabaseMultiplayer';

interface PlayerData {
  userId: string;
  username: string;
  characterModel?: string;
}

interface SocketPlayer {
  id: string;
  username: string;
  position: { x: number; y: number; z: number };
  targetPosition?: { x: number; y: number; z: number };
  direction: number;
  modelFile: string;
  isMoving: boolean;
  isMovingAnim: boolean;
  animPhase: number;
  chatMessage?: string;
  chatMessageTime?: number;
}

export function useHybridMultiplayer(playerData: PlayerData | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketPlayers, setSocketPlayers] = useState<Map<string, SocketPlayer>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const lastPositionUpdate = useRef<{ x: number; z: number; time: number }>({ x: 0, z: 0, time: 0 });

  // Use database multiplayer as fallback
  const {
    players: dbPlayers,
    sendMovement: dbSendMovement,
    sendChatMessage: dbSendChatMessage,
    isConnected: isDbConnected,
    playersCount: dbPlayersCount
  } = useDatabaseMultiplayer(playerData);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!playerData) return;

    // Connect to render server
    const serverUrl = import.meta.env.VITE_MULTIPLAYER_SERVER_URL || 'http://localhost:3001';
    console.log('[HybridMultiplayer] Connecting to game server:', serverUrl);

    const newSocket = io(serverUrl, {
      auth: {
        userId: playerData.userId,
        username: playerData.username
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('[HybridMultiplayer] Socket connected!');
      setIsSocketConnected(true);

      // Join the main game room
      newSocket.emit('join-room', {
        roomName: 'main',
        player: {
          id: playerData.userId,
          username: playerData.username,
          position: { x: 0, y: 0, z: 0 },
          direction: 0,
          modelFile: playerData.characterModel || 'blue_blue_white.glb',
          isMoving: false,
          isMovingAnim: false,
          animPhase: 0,
          velocity: { x: 0, y: 0, z: 0 }
        }
      });
    });

    newSocket.on('disconnect', () => {
      console.log('[HybridMultiplayer] Socket disconnected!');
      setIsSocketConnected(false);
    });

    // Handle room state updates
    newSocket.on('room-state', (players: SocketPlayer[]) => {
      console.log('[HybridMultiplayer] Received room state:', players.length, 'players');
      const newPlayers = new Map<string, SocketPlayer>();
      players.forEach(player => {
        if (player.id !== playerData.userId) {
          newPlayers.set(player.id, player);
        }
      });
      setSocketPlayers(newPlayers);
    });

    // Handle player movements
    newSocket.on('player-moved', (data: any) => {
      if (data.id !== playerData.userId) {
        setSocketPlayers(prev => {
          const updated = new Map(prev);
          const existing = updated.get(data.id);
          updated.set(data.id, {
            ...existing,
            ...data
          });
          return updated;
        });
      }
    });

    // Handle player chat
    newSocket.on('player-chat', (data: { id: string; message: string; timestamp: number }) => {
      if (data.id !== playerData.userId) {
        setSocketPlayers(prev => {
          const updated = new Map(prev);
          const player = updated.get(data.id);
          if (player) {
            player.chatMessage = data.message;
            player.chatMessageTime = data.timestamp;
          }
          return updated;
        });
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('[HybridMultiplayer] Cleaning up socket connection');
      newSocket.close();
    };
  }, [playerData]);

  // Send movement through both socket and database
  const sendMovement = useCallback((sourceX: number, sourceY: number, destX: number, destY: number, direction: string) => {
    // Send to database for persistence
    dbSendMovement(sourceX, sourceY, destX, destY, direction);

    // Send to socket for real-time updates
    if (socketRef.current?.connected) {
      const directionRadians = {
        'N': 0,
        'NE': -Math.PI / 4,
        'E': -Math.PI / 2,
        'SE': -3 * Math.PI / 4,
        'S': Math.PI,
        'SW': 3 * Math.PI / 4,
        'W': Math.PI / 2,
        'NW': Math.PI / 4
      }[direction] || 0;

      socketRef.current.emit('request-move', {
        targetPosition: { x: destX, y: 0, z: destY }
      });
    }
  }, [dbSendMovement]);

  // Send position updates during movement
  const sendPositionUpdate = useCallback((x: number, z: number, direction: string) => {
    const now = Date.now();
    
    // Throttle updates to every 100ms
    if (now - lastPositionUpdate.current.time < 100) return;
    
    // Only send if position changed significantly
    const dx = Math.abs(x - lastPositionUpdate.current.x);
    const dz = Math.abs(z - lastPositionUpdate.current.z);
    if (dx < 0.5 && dz < 0.5) return;

    lastPositionUpdate.current = { x, z, time: now };

    if (socketRef.current?.connected && playerData) {
      const directionRadians = {
        'N': 0,
        'NE': -Math.PI / 4,
        'E': -Math.PI / 2,
        'SE': -3 * Math.PI / 4,
        'S': Math.PI,
        'SW': 3 * Math.PI / 4,
        'W': Math.PI / 2,
        'NW': Math.PI / 4
      }[direction] || 0;

      socketRef.current.emit('player-move', {
        position: { x, y: 0, z },
        direction: directionRadians,
        isMoving: true,
        isMovingAnim: true,
        animPhase: Date.now() * 0.008
      });
    }
  }, [playerData]);

  // Send chat through both systems
  const sendChatMessage = useCallback((message: string) => {
    // Send to database
    dbSendChatMessage(message);

    // Send to socket
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat-message', {
        message,
        timestamp: Date.now()
      });
    }
  }, [dbSendChatMessage]);

  // Merge players from both sources
  const mergedPlayers = new Map<string, any>();
  
  // Add database players
  dbPlayers.forEach((player, id) => {
    mergedPlayers.set(id, {
      ...player,
      source: 'database'
    });
  });

  // Override with socket players (more real-time)
  socketPlayers.forEach((player, id) => {
    const dbPlayer = dbPlayers.get(id);
    mergedPlayers.set(id, {
      id: player.id,
      name: player.username,
      position: player.position,
      targetPosition: player.targetPosition,
      sourcePosition: player.position, // Socket updates are immediate
      movementStartTime: Date.now(),
      direction: 'S', // Convert from radians later
      modelType: player.modelFile,
      lastUpdate: Date.now(),
      isMoving: player.isMoving,
      chatMessage: player.chatMessage,
      chatTimestamp: player.chatMessageTime,
      source: 'socket'
    });
  });

  return {
    players: mergedPlayers,
    sendMovement,
    sendPositionUpdate,
    sendChatMessage,
    isConnected: isSocketConnected || isDbConnected,
    playersCount: Math.max(socketPlayers.size + 1, dbPlayersCount),
    isSocketConnected,
    isDbConnected
  };
}