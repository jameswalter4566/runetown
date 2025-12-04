import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

export interface ServerPlayerState {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  direction: number;
  username: string;
  modelFile: string;
  isMoving: boolean;
  isMovingAnim: boolean;
  animPhase: number;
  userId?: string;
  chatMessage?: string;
  chatMessageTime?: number;
  lastUpdate?: number;
}

interface UseServerAuthoritativeMultiplayerOptions {
  username: string;
  modelFile: string;
  currentMap: string;
  isSignedIn: boolean;
  userId?: string;
}

export function useServerAuthoritativeMultiplayer({
  username,
  userId,
  modelFile,
  currentMap,
  isSignedIn
}: UseServerAuthoritativeMultiplayerOptions) {
  const [players, setPlayers] = useState<Map<string, ServerPlayerState>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  // Initialize connection
  useEffect(() => {
    if (!isSignedIn || !username) return;

    // Generate consistent player ID
    const playerId = localStorage.getItem('playerId') || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('playerId', playerId);
    setMyPlayerId(playerId);

    // Connect to Socket.io server
    console.log('Connecting to Socket.io server at:', SOCKET_SERVER_URL);
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to game server');
      setIsConnected(true);

      // Join the room - server will handle initial position
      socket.emit('join-room', {
        roomName: `runescape-${currentMap}`,
        player: {
          id: playerId,
          username,
          modelFile,
          position: { x: 0, y: 0, z: 0 },
          velocity: { x: 0, y: 0, z: 0 },
          direction: 0,
          isMoving: false,
          isMovingAnim: false,
          animPhase: 0,
          userId: userId
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from game server');
      setIsConnected(false);
      setPlayers(new Map());
    });

    // Handle room state updates - this is ALL players including ourselves
    socket.on('room-state', (roomPlayers: ServerPlayerState[]) => {
      console.log('Received room state with', roomPlayers.length, 'players');
      const newPlayers = new Map();
      roomPlayers.forEach(player => {
        newPlayers.set(player.id, player);
      });
      setPlayers(newPlayers);
    });

    // Handle new player joining
    socket.on('player-joined', (player: ServerPlayerState) => {
      console.log(`${player.username} joined the game`);
      setPlayers(prev => new Map(prev).set(player.id, player));
    });

    // Handle player leaving
    socket.on('player-left', (playerId: string) => {
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        newPlayers.delete(playerId);
        return newPlayers;
      });
    });

    // Handle ALL player updates (including our own)
    socket.on('player-update', (data: ServerPlayerState) => {
      setPlayers(prev => {
        const newPlayers = new Map(prev);
        newPlayers.set(data.id, data);
        return newPlayers;
      });
    });

    // Handle chat messages
    socket.on('player-chat', (data: { id: string; message: string; timestamp: number }) => {
      console.log('[CHAT] Received:', data);
      setPlayers(prev => {
        const player = prev.get(data.id);
        if (player) {
          const newPlayers = new Map(prev);
          newPlayers.set(data.id, { 
            ...player, 
            chatMessage: data.message,
            chatMessageTime: data.timestamp
          });
          return newPlayers;
        }
        return prev;
      });
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentMap, isSignedIn, username, modelFile, userId]);

  // Send movement request to server
  const requestMoveTo = useCallback((targetPosition: { x: number; y: number; z: number }) => {
    if (!socketRef.current || !myPlayerId) return;
    
    console.log('Requesting move to:', targetPosition);
    socketRef.current.emit('request-move', {
      targetPosition
    });
  }, [myPlayerId]);

  // Send chat message
  const sendChatMessage = useCallback((message: string) => {
    if (!socketRef.current || !myPlayerId) return;
    
    socketRef.current.emit('chat-message', {
      message,
      timestamp: Date.now()
    });
  }, [myPlayerId]);

  // Get all players for rendering (including ourselves)
  const getAllPlayers = useCallback(() => {
    return Array.from(players.values());
  }, [players]);

  // Get our own player data
  const getMyPlayer = useCallback(() => {
    if (!myPlayerId) return null;
    return players.get(myPlayerId) || null;
  }, [players, myPlayerId]);

  return {
    requestMoveTo,
    getAllPlayers,
    getMyPlayer,
    isConnected,
    sendChatMessage,
    playerCount: players.size,
    myPlayerId
  };
}