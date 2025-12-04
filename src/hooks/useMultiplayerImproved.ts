import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { PlayerController, RemotePlayerController } from '@/lib/multiplayerEngine';
import { normalizePosition } from '@/utils/gridSystem';

export interface PlayerState {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: number;
  direction: number;
  username: string;
  modelFile: string;
  currentMap: string;
  isMoving: boolean;
  isWaddling: boolean;
  waddlePhase: number;
  lastUpdate: number;
  lastProcessedInput: number;
}

export interface GameRoomState {
  players: Map<string, PlayerState>;
  remotePlayers: Map<string, RemotePlayerController>;
  localPlayerId: string | null;
  localPlayer: PlayerController | null;
}

interface UseMultiplayerOptions {
  username: string;
  modelFile: string;
  currentMap: string;
  isSignedIn: boolean;
  initialPosition?: { x: number; y: number; z: number };
  onPlayerJoin?: (player: PlayerState) => void;
  onPlayerLeave?: (playerId: string) => void;
  onPlayerUpdate?: (player: PlayerState) => void;
}

export function useMultiplayerImproved({
  username,
  modelFile,
  currentMap,
  isSignedIn,
  initialPosition = { x: 0, y: 0, z: 0 },
  onPlayerJoin,
  onPlayerLeave,
  onPlayerUpdate
}: UseMultiplayerOptions) {
  const [gameState, setGameState] = useState<GameRoomState>({
    players: new Map(),
    remotePlayers: new Map(),
    localPlayerId: null,
    localPlayer: null
  });
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localPlayerIdRef = useRef<string | null>(null);
  const localPlayerRef = useRef<PlayerController | null>(null);
  const updateLoopRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(Date.now());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttempts = useRef<number>(0);
  const lastPresenceUpdate = useRef<number>(0);
  
  // Initialize connection
  useEffect(() => {
    if (!isSignedIn || !username) return;

    const initializeMultiplayer = async () => {
      // Generate unique player ID
      const playerId = localStorage.getItem('playerId') || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('playerId', playerId);
      localPlayerIdRef.current = playerId;
      
      // Create local player controller
      console.log('Creating local player with initial position:', initialPosition);
      const localPlayer = new PlayerController(initialPosition);
      localPlayerRef.current = localPlayer;
      
      setGameState(prev => ({ 
        ...prev, 
        localPlayerId: playerId,
        localPlayer 
      }));
      
      // Create Supabase channel with optimized settings
      const channel = supabase.channel(`game-map:${currentMap}`, {
        config: {
          broadcast: { 
            self: false,
            ack: true // Wait for server acknowledgment
          },
          presence: { 
            key: playerId
          }
        }
      });
      
      channelRef.current = channel;
      
      // Handle presence sync (players joining/leaving)
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PlayerState>();
          updatePlayersFromPresence(state);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (newPresences.length > 0) {
            const player = newPresences[0] as PlayerState;
            handlePlayerJoin(key, player);
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          handlePlayerLeave(key);
        })
        // Handle player inputs (for server authority)
        .on('broadcast', { event: 'player-input' }, ({ payload }) => {
          // In a real implementation, this would be processed by a server
          // For now, we'll just broadcast state updates
        })
        // Handle state updates from other players
        .on('broadcast', { event: 'player-state' }, ({ payload }) => {
          handlePlayerStateUpdate(payload as PlayerState);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            connectionAttempts.current = 0; // Reset attempts on successful connection
            console.log('Connected to multiplayer room');
            
            // Track local player presence
            const playerState: PlayerState = {
              id: playerId,
              position: initialPosition,
              velocity: { x: 0, y: 0, z: 0 },
              rotation: 0,
              direction: 0,
              username,
              modelFile,
              currentMap,
              isMoving: false,
              isWaddling: false,
              waddlePhase: 0,
              lastUpdate: Date.now(),
              lastProcessedInput: 0
            };
            
            await channel.track(playerState);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Multiplayer connection error:', status);
            handleReconnect();
          }
        });
      
      // Start update loop
      startUpdateLoop();
    };
    
    initializeMultiplayer();
    
    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (updateLoopRef.current) {
        cancelAnimationFrame(updateLoopRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [currentMap, isSignedIn]); // Only re-initialize on map change or sign-in status
  
  // Update loop for physics and network updates
  const startUpdateLoop = () => {
    console.log('Starting physics update loop');
    const update = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateTime.current) / 1000;
      lastUpdateTime.current = now;
      
      // Update local player physics
      if (localPlayerRef.current) {
        localPlayerRef.current.update(deltaTime);
        
        // Send state update (throttled to 10Hz for better network performance)
        if (now % 100 < deltaTime * 1000) {
          sendStateUpdate();
        }
      }
      
      updateLoopRef.current = requestAnimationFrame(update);
    };
    
    updateLoopRef.current = requestAnimationFrame(update);
  };
  
  // Send local player state to other players
  const sendStateUpdate = useCallback(() => {
    if (!channelRef.current || !localPlayerRef.current || !localPlayerIdRef.current) return;
    
    const now = Date.now();
    const state = localPlayerRef.current.getState();
    const playerState: PlayerState = {
      id: localPlayerIdRef.current,
      position: state.position,
      velocity: state.velocity,
      rotation: 0,
      direction: state.direction,
      username,
      modelFile,
      currentMap,
      isMoving: state.isMoving,
      isWaddling: state.isMoving,
      waddlePhase: state.isMoving ? Date.now() * 0.008 : 0, // Match original waddle speed
      lastUpdate: now,
      lastProcessedInput: state.sequenceNumber
    };
    
    // Update presence (throttled to prevent spam)
    if (now - lastPresenceUpdate.current > 1000) { // Only update presence every second
      channelRef.current.track(playerState);
      lastPresenceUpdate.current = now;
    }
    
    // Broadcast state
    channelRef.current.send({
      type: 'broadcast',
      event: 'player-state',
      payload: playerState
    });
  }, [username, modelFile, currentMap]);
  
  // Process movement input
  const processMovementInput = useCallback((targetPosition: { x: number; y: number; z: number } | null) => {
    if (!localPlayerRef.current) {
      console.log('No local player ref!');
      return;
    }
    
    console.log('Processing movement input:', targetPosition);
    const input = localPlayerRef.current.processInput(targetPosition);
    
    // Send input to server (in a real implementation)
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-input',
        payload: input
      });
    }
  }, []);
  
  // Get current position for local player
  const getLocalPlayerPosition = useCallback(() => {
    if (!localPlayerRef.current) return { x: 0, y: 0, z: 0 };
    return localPlayerRef.current.getRenderPosition();
  }, []);
  
  // Get remote player render data
  const getRemotePlayerData = useCallback((playerId: string) => {
    const remotePlayer = gameState.remotePlayers.get(playerId);
    const playerState = gameState.players.get(playerId);
    
    if (!remotePlayer || !playerState) return null;
    
    const now = Date.now();
    const position = remotePlayer.getRenderPosition(now);
    const direction = remotePlayer.getDirection();
    
    return {
      ...playerState,
      position,
      direction
    };
  }, [gameState.remotePlayers, gameState.players]);
  
  // Helper functions
  const updatePlayersFromPresence = (state: RealtimePresenceState<PlayerState>) => {
    const players = new Map<string, PlayerState>();
    const remotePlayers = new Map<string, RemotePlayerController>();
    
    Object.entries(state).forEach(([key, presences]) => {
      if (presences.length > 0 && key !== localPlayerIdRef.current) {
        const playerData = presences[0] as PlayerState;
        players.set(key, playerData);
        
        // Create or update remote player controller
        let remotePlayer = gameState.remotePlayers.get(key);
        if (!remotePlayer) {
          remotePlayer = new RemotePlayerController(playerData.position);
        }
        remotePlayer.receiveUpdate(
          playerData.position,
          playerData.direction,
          playerData.velocity,
          playerData.lastUpdate
        );
        remotePlayers.set(key, remotePlayer);
      }
    });
    
    setGameState(prev => ({ 
      ...prev, 
      players,
      remotePlayers 
    }));
  };
  
  const handlePlayerJoin = (playerId: string, player: PlayerState) => {
    if (playerId === localPlayerIdRef.current) return;
    
    const remotePlayer = new RemotePlayerController(player.position);
    remotePlayer.receiveUpdate(
      player.position,
      player.direction,
      player.velocity,
      player.lastUpdate
    );
    
    setGameState(prev => {
      const newPlayers = new Map(prev.players);
      const newRemotePlayers = new Map(prev.remotePlayers);
      newPlayers.set(playerId, player);
      newRemotePlayers.set(playerId, remotePlayer);
      return { ...prev, players: newPlayers, remotePlayers: newRemotePlayers };
    });
    
    onPlayerJoin?.(player);
  };
  
  const handlePlayerLeave = (playerId: string) => {
    setGameState(prev => {
      const newPlayers = new Map(prev.players);
      const newRemotePlayers = new Map(prev.remotePlayers);
      newPlayers.delete(playerId);
      newRemotePlayers.delete(playerId);
      return { ...prev, players: newPlayers, remotePlayers: newRemotePlayers };
    });
    
    onPlayerLeave?.(playerId);
  };
  
  // Handle reconnection with exponential backoff
  const handleReconnect = () => {
    if (connectionAttempts.current >= 5) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    connectionAttempts.current++;
    const backoffTime = Math.min(1000 * Math.pow(2, connectionAttempts.current), 30000);
    
    console.log(`Reconnecting in ${backoffTime}ms (attempt ${connectionAttempts.current})...`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.subscribe();
      }
    }, backoffTime);
  };

  const handlePlayerStateUpdate = (player: PlayerState) => {
    if (player.id === localPlayerIdRef.current) {
      // This is a server update for our local player - use for reconciliation
      if (localPlayerRef.current) {
        localPlayerRef.current.receiveServerUpdate({
          position: player.position,
          direction: player.direction,
          velocity: player.velocity,
          lastProcessedInput: player.lastProcessedInput,
          timestamp: player.lastUpdate
        });
      }
    } else {
      // Update remote player
      const remotePlayer = gameState.remotePlayers.get(player.id);
      if (remotePlayer) {
        remotePlayer.receiveUpdate(
          player.position,
          player.direction,
          player.velocity,
          player.lastUpdate
        );
      }
      
      setGameState(prev => {
        const newPlayers = new Map(prev.players);
        newPlayers.set(player.id, player);
        return { ...prev, players: newPlayers };
      });
      
      onPlayerUpdate?.(player);
    }
  };
  
  // Get other players (excluding local player)
  const getOtherPlayers = useCallback((): Array<PlayerState & { renderPosition: { x: number; y: number; z: number } }> => {
    const players: Array<PlayerState & { renderPosition: { x: number; y: number; z: number } }> = [];
    
    gameState.players.forEach((player, playerId) => {
      if (playerId !== localPlayerIdRef.current) {
        const renderData = getRemotePlayerData(playerId);
        if (renderData) {
          players.push({
            ...player,
            renderPosition: renderData.position,
            position: renderData.position,
            direction: renderData.direction
          });
        }
      }
    });
    
    return players;
  }, [gameState.players, getRemotePlayerData]);
  
  return {
    gameState,
    processMovementInput,
    getLocalPlayerPosition,
    getOtherPlayers,
    isConnected: channelRef.current?.state === 'joined'
  };
}