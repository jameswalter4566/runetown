import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PlayerState {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  username: string;
  modelFile: string;
  isMoving: boolean;
  lastUpdate: number;
}

export interface GameRoomState {
  players: Map<string, PlayerState>;
  localPlayerId: string | null;
}

interface UseSimpleMultiplayerOptions {
  username: string;
  modelFile: string;
  userId: string;
}

export function useSimpleMultiplayer({
  username,
  modelFile,
  userId
}: UseSimpleMultiplayerOptions) {
  const [gameState, setGameState] = useState<GameRoomState>({
    players: new Map(),
    localPlayerId: userId
  });
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const updateThrottleRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(0);
  
  // Initialize connection
  useEffect(() => {
    // CRITICAL: Don't initialize until user has logged in!
    if (!userId || !username || username === '' || userId === '') {
      console.log('[SimpleMultiplayer] Skipping init - no user data');
      return;
    }

    const initializeMultiplayer = async () => {
      console.log('[SimpleMultiplayer] Initializing for user:', username, 'with ID:', userId);
      
      // Create Supabase channel
      const channel = supabase.channel('game-room', {
        config: {
          broadcast: { self: false },
          presence: { key: userId }
        }
      });
      
      channelRef.current = channel;
      
      // Handle presence sync
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const newPlayers = new Map<string, PlayerState>();
          
          Object.entries(state).forEach(([id, presences]) => {
            if (presences && presences.length > 0 && id !== userId) {
              const playerData = presences[0] as PlayerState;
              // Add lastUpdate to detect stale players
              playerData.lastUpdate = playerData.lastUpdate || Date.now();
              newPlayers.set(id, playerData);
            }
          });
          
          setGameState(prev => ({ ...prev, players: newPlayers }));
          console.log('[SimpleMultiplayer] Players synced:', newPlayers.size, 'players');
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (key !== userId && newPresences.length > 0) {
            const player = newPresences[0] as PlayerState;
            setGameState(prev => {
              const newPlayers = new Map(prev.players);
              newPlayers.set(key, player);
              return { ...prev, players: newPlayers };
            });
            console.log('[SimpleMultiplayer] Player joined:', player.username);
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          if (key !== userId) {
            setGameState(prev => {
              const newPlayers = new Map(prev.players);
              newPlayers.delete(key);
              return { ...prev, players: newPlayers };
            });
            console.log('[SimpleMultiplayer] Player left:', key);
          }
        })
        // Handle position updates
        .on('broadcast', { event: 'player-update' }, ({ payload }) => {
          const playerUpdate = payload as PlayerState;
          if (playerUpdate.id !== userId) {
            setGameState(prev => {
              const newPlayers = new Map(prev.players);
              newPlayers.set(playerUpdate.id, playerUpdate);
              return { ...prev, players: newPlayers };
            });
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[SimpleMultiplayer] Connected to game room');
            
            // Track local player presence
            const playerState: PlayerState = {
              id: userId,
              position: { x: -80, y: 0, z: 0 },
              rotation: 0,
              username,
              modelFile,
              isMoving: false,
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
        console.log('[SimpleMultiplayer] Cleaning up');
        channelRef.current.unsubscribe();
      }
    };
  }, [userId, username, modelFile]);
  
  // Update local player position
  const updateLocalPlayer = useCallback((position: { x: number; z: number }, rotation: number, isMoving: boolean) => {
    if (!channelRef.current || !userId) return;
    
    // Throttle to 30 updates per second
    const now = Date.now();
    if (now - updateThrottleRef.current < 33) return;
    updateThrottleRef.current = now;
    
    // Force periodic sync every 2 seconds to prevent players disappearing
    if (now - lastSyncRef.current > 2000) {
      lastSyncRef.current = now;
      // Force re-track presence to ensure visibility
      console.log('[SimpleMultiplayer] Forcing periodic sync');
      
      // Re-track our presence to force sync
      const currentState: PlayerState = {
        id: userId,
        position: { x: position.x, y: 0, z: position.z },
        rotation,
        username,
        modelFile,
        isMoving,
        lastUpdate: now
      };
      channelRef.current.track(currentState);
    }
    
    const playerState: PlayerState = {
      id: userId,
      position: { x: position.x, y: 0, z: position.z },
      rotation,
      username,
      modelFile,
      isMoving,
      lastUpdate: now
    };
    
    // Update presence
    channelRef.current.track(playerState);
    
    // Broadcast update
    channelRef.current.send({
      type: 'broadcast',
      event: 'player-update',
      payload: playerState
    });
    
    console.log('[SimpleMultiplayer] Broadcasting position:', {
      x: position.x.toFixed(1),
      z: position.z.toFixed(1),
      moving: isMoving
    });
  }, [userId, username, modelFile]);
  
  return {
    players: gameState.players,
    localPlayerId: gameState.localPlayerId,
    updateLocalPlayer,
    playersCount: gameState.players.size + 1
  };
}