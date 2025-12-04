import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import * as THREE from 'three';
import { normalizePosition } from '@/utils/gridSystem';

export interface PlayerState {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  direction: number; // Direction the player is facing (in radians)
  username: string;
  modelFile: string;
  currentMap: string;
  isMoving: boolean;
  isWaddling: boolean; // Whether the player is currently waddling
  waddlePhase: number; // Current phase of the waddle animation
  lastUpdate: number;
}

export interface GameRoomState {
  players: Map<string, PlayerState>;
  localPlayerId: string | null;
}

interface UseMultiplayerOptions {
  username: string;
  modelFile: string;
  currentMap: string;
  isSignedIn: boolean;
  onPlayerJoin?: (player: PlayerState) => void;
  onPlayerLeave?: (playerId: string) => void;
  onPlayerUpdate?: (player: PlayerState) => void;
}

export function useMultiplayer({
  username,
  modelFile,
  currentMap,
  isSignedIn,
  onPlayerJoin,
  onPlayerLeave,
  onPlayerUpdate
}: UseMultiplayerOptions) {
  const [gameState, setGameState] = useState<GameRoomState>({
    players: new Map(),
    localPlayerId: null
  });
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localPlayerIdRef = useRef<string | null>(null);
  const updateThrottleRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(0);
  const lastPositionRef = useRef<PlayerState | null>(null);
  
  // Initialize connection
  useEffect(() => {
    if (!isSignedIn || !username) return;

    const initializeMultiplayer = async () => {
      // Generate unique player ID
      const playerId = localStorage.getItem('playerId') || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('playerId', playerId);
      localPlayerIdRef.current = playerId;
      
      setGameState(prev => ({ ...prev, localPlayerId: playerId }));
      
      // Create Supabase channel for the current map
      const channel = supabase.channel(`game-map:${currentMap}`, {
        config: {
          broadcast: { self: false }, // Don't receive own broadcasts
          presence: { key: playerId }
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
        // Handle real-time position/state updates
        .on('broadcast', { event: 'player-update' }, ({ payload }) => {
          handlePlayerUpdate(payload as PlayerState);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track local player presence
            const playerState: PlayerState = {
              id: playerId,
              position: { x: 0, y: 0, z: 0 },
              rotation: 0,
              direction: 0,
              username,
              modelFile,
              currentMap,
              isMoving: false,
              isWaddling: false,
              waddlePhase: 0,
              lastUpdate: Date.now()
            };
            
            await channel.track(playerState);
          }
        });
    };
    
    initializeMultiplayer();
    
    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [currentMap, username, modelFile, isSignedIn]);
  
  // Update local player state
  const updateLocalPlayer = useCallback((updates: Partial<PlayerState>) => {
    if (!channelRef.current || !localPlayerIdRef.current || !isSignedIn) return;
    
    // Throttle updates to 60 times per second for smoother movement
    const now = Date.now();
    if (now - updateThrottleRef.current < 16) return; // 16ms = ~60fps
    updateThrottleRef.current = now;
    
    // Normalize position to ensure consistency across clients
    const normalizedPosition = updates.position ? normalizePosition(updates.position) : { x: 0, y: 0, z: 0 };
    
    const playerState: PlayerState = {
      id: localPlayerIdRef.current,
      position: normalizedPosition,
      rotation: updates.rotation || 0,
      direction: updates.direction || 0,
      username: updates.username || username,
      modelFile: updates.modelFile || modelFile,
      currentMap: updates.currentMap || currentMap,
      isMoving: updates.isMoving || false,
      isWaddling: updates.isWaddling || false,
      waddlePhase: updates.waddlePhase || 0,
      lastUpdate: now
    };
    
    // Update presence
    channelRef.current.track(playerState);
    
    // Broadcast update for real-time movement
    channelRef.current.send({
      type: 'broadcast',
      event: 'player-update',
      payload: playerState
    });
    
    // Store last position
    lastPositionRef.current = playerState;
    
    // Force full sync every 2 seconds to ensure accuracy
    if (now - lastSyncRef.current > 2000) {
      lastSyncRef.current = now;
      channelRef.current.track(playerState);
    }
  }, [username, modelFile, currentMap, isSignedIn]);
  
  
  // Helper functions
  const updatePlayersFromPresence = (state: RealtimePresenceState<PlayerState>) => {
    const players = new Map<string, PlayerState>();
    
    Object.entries(state).forEach(([key, presences]) => {
      if (presences.length > 0) {
        const playerData = presences[0] as PlayerState;
        players.set(key, playerData);
      }
    });
    
    setGameState(prev => ({ ...prev, players }));
  };
  
  const handlePlayerJoin = (playerId: string, player: PlayerState) => {
    setGameState(prev => {
      const newPlayers = new Map(prev.players);
      newPlayers.set(playerId, player);
      return { ...prev, players: newPlayers };
    });
    
    onPlayerJoin?.(player);
  };
  
  const handlePlayerLeave = (playerId: string) => {
    setGameState(prev => {
      const newPlayers = new Map(prev.players);
      newPlayers.delete(playerId);
      return { ...prev, players: newPlayers };
    });
    
    onPlayerLeave?.(playerId);
  };
  
  const handlePlayerUpdate = (player: PlayerState) => {
    setGameState(prev => {
      const newPlayers = new Map(prev.players);
      newPlayers.set(player.id, player);
      return { ...prev, players: newPlayers };
    });
    
    onPlayerUpdate?.(player);
  };
  
  // Get other players (excluding local player)
  const getOtherPlayers = useCallback((): PlayerState[] => {
    return Array.from(gameState.players.values()).filter(
      player => player.id !== localPlayerIdRef.current
    );
  }, [gameState.players]);
  
  return {
    gameState,
    updateLocalPlayer,
    getOtherPlayers,
    isConnected: channelRef.current?.state === 'joined'
  };
}