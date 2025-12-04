import { useEffect, useState, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

export interface PlayerState {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  direction: number;
  username: string;
  modelFile: string;
  isMoving: boolean;
  isMovingAnim: boolean;
  animPhase: number;
  userId: string;
  lastUpdate: number;
  chatMessage?: string;
  chatMessageTime?: number;
}

interface UseSocketMultiplayerOptions {
  username: string;
  modelFile: string;
  currentMap: string;
  isSignedIn: boolean;
  userId: string;
  initialPosition?: { x: number; y: number; z: number };
}

export function useSocketMultiplayer({
  username,
  modelFile,
  currentMap,
  isSignedIn,
  userId,
  initialPosition = { x: -80, y: 0, z: 0 }
}: UseSocketMultiplayerOptions) {
  const [players, setPlayers] = useState<Map<string, PlayerState>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [localPlayerId, setLocalPlayerId] = useState<string>('');
  
  const socketRef = useRef<Socket | null>(null);
  const updateThrottleRef = useRef<number>(0);
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const roomStateIntervalRef = useRef<NodeJS.Timeout>();
  
  // Initialize Socket.io connection
  useEffect(() => {
    // CRITICAL: Only connect when user is signed in!
    if (!isSignedIn || !username || !userId) {
      console.log('[SocketMultiplayer] Not connecting - missing requirements:', { isSignedIn, username, userId });
      return;
    }

    console.log('[SocketMultiplayer] Initializing connection for:', username);
    
    // Generate consistent player ID
    const playerId = `${userId}-${Date.now()}`;
    setLocalPlayerId(playerId);
    
    // Connect to Socket.io server - HARDCODED to Render server
    const socketUrl = 'https://runetown-server.onrender.com';
      
    console.log('[SocketMultiplayer] Connecting to:', socketUrl);
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        userId,
        username
      }
    });
    
    socketRef.current = socket;
    
    // Connection events
    socket.on('connect', () => {
      console.log('[SocketMultiplayer] Connected to server!');
      setIsConnected(true);
      
      // Join the game room
      const playerData = {
        id: playerId,
        username,
        modelFile,
        position: initialPosition,
        velocity: { x: 0, y: 0, z: 0 },
        direction: 0,
        isMoving: false,
        isMovingAnim: false,
        animPhase: 0,
        userId,
        lastUpdate: Date.now()
      };
      
      socket.emit('join-room', {
        roomName: `game-map:${currentMap}`,
        player: playerData
      });
      
      // Also emit player-ready to ensure server knows we're fully connected
      socket.emit('player-ready', playerData);
      
      // Request current room state after a short delay
      setTimeout(() => {
        console.log('[SocketMultiplayer] Requesting initial room state');
        socket.emit('request-room-state', { roomName: `game-map:${currentMap}` });
        
        // Also send our initial position to ensure we're visible
        socket.emit('player-move', {
          position: initialPosition,
          velocity: { x: 0, y: 0, z: 0 },
          direction: 0,
          username,
          modelFile,
          isMoving: false,
          isMovingAnim: false,
          animPhase: 0,
          userId,
          lastUpdate: Date.now()
        });
      }, 100);
      
      // Periodic room state sync to ensure all players are visible
      // This helps when the server doesn't properly track players who haven't moved
      roomStateIntervalRef.current = setInterval(() => {
        console.log('[SocketMultiplayer] Requesting periodic room state sync');
        socket.emit('request-room-state', { roomName: `game-map:${currentMap}` });
      }, 3000); // Request every 3 seconds
      
      // Start latency measurement
      pingIntervalRef.current = setInterval(() => {
        const start = Date.now();
        socket.emit('ping', start);
      }, 5000);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('[SocketMultiplayer] Disconnected from server. Reason:', reason);
      setIsConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('[SocketMultiplayer] Connection error:', error.message);
      console.error('[SocketMultiplayer] Error type:', error.type);
      console.error('[SocketMultiplayer] Full error:', error);
    });
    
    socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log('[SocketMultiplayer] Reconnection attempt #', attemptNumber);
    });
    
    // Receive room state (all players)
    socket.on('room-state', (playersArray: PlayerState[]) => {
      console.log('[SocketMultiplayer] Received room state with', playersArray.length, 'total players');
      const newPlayers = new Map<string, PlayerState>();
      playersArray.forEach(player => {
        if (player.id !== playerId) {
          newPlayers.set(player.id, player);
          console.log('[SocketMultiplayer] Added player to state:', player.username, 'at', player.position);
        }
      });
      setPlayers(newPlayers);
      console.log('[SocketMultiplayer] Room state updated:', newPlayers.size, 'other players visible');
    });
    
    // Also handle alternative room state event name that some servers use
    socket.on('current-players', (playersArray: PlayerState[]) => {
      console.log('[SocketMultiplayer] Received current-players with', playersArray.length, 'total players');
      const newPlayers = new Map<string, PlayerState>();
      playersArray.forEach(player => {
        if (player.id !== playerId) {
          newPlayers.set(player.id, player);
        }
      });
      setPlayers(newPlayers);
    });
    
    // New player joined
    socket.on('player-joined', (player: PlayerState) => {
      if (player.id !== playerId) {
        setPlayers(prev => {
          const updated = new Map(prev);
          updated.set(player.id, player);
          console.log('[SocketMultiplayer] New player joined:', player.username);
          return updated;
        });
      }
    });
    
    // Player movement updates
    socket.on('player-moved', (player: PlayerState) => {
      if (player.id !== playerId) {
        setPlayers(prev => {
          const updated = new Map(prev);
          updated.set(player.id, player);
          return updated;
        });
      }
    });
    
    // Chat message updates
    socket.on('player-chat', (data: { id: string; message: string; timestamp: number }) => {
      console.log('[SocketMultiplayer] Received player chat:', data);
      if (data.id !== playerId) {
        setPlayers(prev => {
          const updated = new Map(prev);
          const player = updated.get(data.id);
          if (player) {
            updated.set(data.id, {
              ...player,
              chatMessage: data.message,
              chatMessageTime: data.timestamp
            });
          }
          return updated;
        });
      }
    });
    
    // Player update with chat message
    socket.on('player-update', (playerData: PlayerState) => {
      console.log('[SocketMultiplayer] Received player update with chat:', playerData);
      if (playerData.id !== playerId) {
        setPlayers(prev => {
          const updated = new Map(prev);
          updated.set(playerData.id, playerData);
          return updated;
        });
      }
    });
    
    // Player left
    socket.on('player-left', (leftPlayerId: string) => {
      setPlayers(prev => {
        const updated = new Map(prev);
        updated.delete(leftPlayerId);
        return updated;
      });
      console.log('[SocketMultiplayer] Player left:', leftPlayerId);
    });
    
    // Chat messages
    socket.on('player-chat', (data: { id: string; message: string; timestamp: number }) => {
      console.log('[SocketMultiplayer] Received chat message:', data);
      if (data.id !== playerId) {
        setPlayers(prev => {
          const updated = new Map(prev);
          const player = updated.get(data.id);
          if (player) {
            updated.set(data.id, {
              ...player,
              chatMessage: data.message,
              chatMessageTime: data.timestamp
            });
            console.log('[SocketMultiplayer] Updated player chat:', player.username, data.message);
          }
          return updated;
        });
      }
    });
    
    // Latency measurement
    socket.on('pong', (timestamp: number) => {
      setLatency(Date.now() - timestamp);
    });
    
    // Cleanup
    return () => {
      console.log('[SocketMultiplayer] Cleaning up connection');
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (roomStateIntervalRef.current) {
        clearInterval(roomStateIntervalRef.current);
      }
      socket.disconnect();
    };
  }, [isSignedIn, username, userId, modelFile, currentMap]); // Removed initialPosition to prevent reconnection loops
  
  // Update local player position
  const updateLocalPlayer = useCallback((position: { x: number; z: number }, rotation: number, isMoving: boolean) => {
    if (!socketRef.current || !isConnected || !localPlayerId) return;
    
    // Throttle updates to 30Hz
    const now = Date.now();
    if (now - updateThrottleRef.current < 33) return;
    updateThrottleRef.current = now;
    
    // Send movement update
    socketRef.current.emit('player-move', {
      position: { x: position.x, y: 0, z: position.z },
      velocity: { x: 0, y: 0, z: 0 }, // Will be calculated server-side
      direction: rotation,
      username,
      modelFile,
      isMoving,
      isMovingAnim: isMoving,
      animPhase: isMoving ? now * 0.008 : 0,
      userId,
      lastUpdate: now
    });
  }, [isConnected, localPlayerId, username, modelFile, userId]);
  
  // Send chat message
  const sendChatMessage = useCallback((message: string) => {
    if (!socketRef.current || !isConnected) {
      console.log('[SocketMultiplayer] Cannot send chat - not connected');
      return;
    }
    
    console.log('[SocketMultiplayer] Sending chat message:', message);
    socketRef.current.emit('player-chat', {
      playerId: localPlayerId,
      message,
      timestamp: Date.now()
    });
  }, [isConnected, localPlayerId]);
  
  return {
    players,
    isConnected,
    latency,
    updateLocalPlayer,
    sendChatMessage,
    playersCount: players.size + 1 // Include local player
  };
}