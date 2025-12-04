import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayerPositionService } from '@/services/playerPositionService';
import { PlayerChatService } from '@/services/playerChatService';
import throttle from 'lodash/throttle';

interface Player {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  sourcePosition: { x: number; y: number; z: number };
  movementStartTime: number;
  direction: string;
  modelType: string;
  lastUpdate: number;
  isMoving: boolean;
  chatMessage?: string;
  chatTimestamp?: number;
  // New fields for buffered interpolation
  positionBuffer: Array<{
    position: { x: number; y: number; z: number };
    timestamp: number;
  }>;
}

interface PlayerPosition {
  player_id: string;
  x: number;
  y: number;
  source_x: number;
  source_y: number;
  direction: string;
  timestamp?: string;
  model_type?: string;
  screen_name: string;
}

export const useOptimizedMultiplayer = (
  playerData: { userId: string; username: string; characterModel?: string } | null
) => {
  // Use refs for rapid updates without React re-renders
  const playersDataRef = useRef<Map<string, Player>>(new Map());
  const positionService = useRef(new PlayerPositionService());
  const chatService = useRef(new PlayerChatService());
  const lastPlayerPosition = useRef({ x: -80, y: 0 });
  const updateQueueRef = useRef<Map<string, PlayerPosition>>(new Map());
  
  // State only for triggering renders when player set changes
  const [playerIds, setPlayerIds] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs for cleanup
  const unsubscribePositionsRef = useRef<(() => void) | null>(null);
  const unsubscribeChatsRef = useRef<(() => void) | null>(null);
  const updateIntervalRef = useRef<number | null>(null);

  // Process queued updates at a controlled rate (20Hz)
  const processQueuedUpdates = useCallback(() => {
    const queue = updateQueueRef.current;
    if (queue.size === 0) return;

    const updates = Array.from(queue.values());
    queue.clear();

    // Process each update
    updates.forEach(update => {
      const player = playersDataRef.current.get(update.player_id);
      const now = Date.now();
      
      // Check if this is actually a movement (source != target)
      const sourceX = update.source_x ?? update.x;
      const sourceY = update.source_y ?? update.y;
      const isActuallyMoving = sourceX !== update.x || sourceY !== update.y;
      
      // Create or update player data
      const newPlayerData: Player = {
        id: update.player_id,
        name: update.screen_name,
        position: { x: sourceX, y: 0, z: sourceY },
        targetPosition: { x: update.x, y: 0, z: update.y },
        sourcePosition: { x: sourceX, y: 0, z: sourceY },
        movementStartTime: update.timestamp ? new Date(update.timestamp).getTime() : now,
        direction: update.direction,
        modelType: player?.modelType || 'red_blue_white.glb',
        lastUpdate: now,
        isMoving: isActuallyMoving,
        chatMessage: player?.chatMessage,
        chatTimestamp: player?.chatTimestamp,
        positionBuffer: player?.positionBuffer || []
      };

      // Add to position buffer for interpolation (keep last 10 positions)
      newPlayerData.positionBuffer.push({
        position: newPlayerData.targetPosition,
        timestamp: newPlayerData.movementStartTime
      });
      if (newPlayerData.positionBuffer.length > 10) {
        newPlayerData.positionBuffer.shift();
      }

      playersDataRef.current.set(update.player_id, newPlayerData);
      
      // Debug log for ALL updates (not just movement)
      console.log(`[OptimizedMultiplayer] Player update for ${update.screen_name}:`, {
        position: `(${update.x.toFixed(1)}, ${update.y.toFixed(1)})`,
        moving: isActuallyMoving,
        lastUpdate: new Date(newPlayerData.lastUpdate).toISOString(),
        playerId: update.player_id.substring(0, 8)
      });
    });

    // Update player IDs if set changed
    const newIds = new Set(playersDataRef.current.keys());
    if (newIds.size !== playerIds.size || !Array.from(newIds).every(id => playerIds.has(id))) {
      setPlayerIds(newIds);
    }
  }, [playerIds]);

  // Throttled update processor (50ms = 20 updates/sec)
  const throttledProcessUpdates = useRef(
    throttle(processQueuedUpdates, 50, { leading: true, trailing: true })
  ).current;

  // Subscribe to position updates
  useEffect(() => {
    if (!playerData?.userId) return;

    const setupSubscription = async () => {
      try {
        // Load initial positions
        const positions = await positionService.current.getLatestPositions();
        const latestPositions = new Map<string, PlayerPosition>();
        
        positions.forEach(pos => {
          const existing = latestPositions.get(pos.player_id);
          if (!existing || new Date(pos.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
            latestPositions.set(pos.player_id, pos);
          }
        });

        // Initialize players data (excluding self)
        console.log('[OptimizedMultiplayer] Loading initial players:', latestPositions.size);
        latestPositions.forEach((pos, playerId) => {
          if (playerId !== playerData.userId) {
            updateQueueRef.current.set(playerId, pos);
            console.log('[OptimizedMultiplayer] Added initial player:', pos.screen_name, 'at', `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
          }
        });
        throttledProcessUpdates();

        // Subscribe to real-time position updates
        unsubscribePositionsRef.current = positionService.current.subscribeToPositions(async (payload) => {
          const newPos = payload.new as PlayerPosition;
          
          // Skip our own position updates
          if (newPos.player_id === playerData?.userId) {
            lastPlayerPosition.current = { x: newPos.x, y: newPos.y };
            return;
          }

          // Queue the update
          updateQueueRef.current.set(newPos.player_id, newPos);
          throttledProcessUpdates();
        }, playerData?.userId);

        // Start update interval for processing
        updateIntervalRef.current = window.setInterval(() => {
          throttledProcessUpdates();
        }, 50);

        setIsConnected(true);
        console.log('[OptimizedMultiplayer] Connected to position updates');
        
        // Send initial position to announce presence
        await positionService.current.insertPosition({
          player_id: playerData.userId,
          x: lastPlayerPosition.current.x,
          y: lastPlayerPosition.current.y,
          source_x: lastPlayerPosition.current.x,
          source_y: lastPlayerPosition.current.y,
          direction: 'S',
          model_type: playerData.characterModel || 'default',
          screen_name: playerData.username || 'Player'
        });
        
      } catch (error) {
        console.error('[OptimizedMultiplayer] Failed to setup subscription:', error);
        setIsConnected(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribePositionsRef.current) {
        unsubscribePositionsRef.current();
      }
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current();
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      throttledProcessUpdates.cancel();
      setIsConnected(false);
    };
  }, [playerData, throttledProcessUpdates]);

  // Heartbeat system
  useEffect(() => {
    if (!playerData || !positionService.current) return;
    
    const heartbeatInterval = setInterval(() => {
      if (lastPlayerPosition.current.x !== -80 || lastPlayerPosition.current.y !== 0) {
        console.log('[OptimizedMultiplayer] Sending heartbeat');
        positionService.current?.insertPosition({
          player_id: playerData.userId,
          x: lastPlayerPosition.current.x,
          y: lastPlayerPosition.current.y,
          source_x: lastPlayerPosition.current.x,
          source_y: lastPlayerPosition.current.y,
          direction: 'S',
          model_type: playerData.characterModel || 'default',
          screen_name: playerData.username || 'Player'
        });
      }
    }, 20000);
    
    return () => clearInterval(heartbeatInterval);
  }, [playerData]);

  // Cleanup stale players - ONLY remove after 30 minutes of no updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let removed = false;
      
      playersDataRef.current.forEach((player, id) => {
        const timeSinceUpdate = now - player.lastUpdate;
        
        // Only remove players after 30 minutes (1800000ms) of no updates
        if (timeSinceUpdate > 1800000) { // 30 minutes
          playersDataRef.current.delete(id);
          removed = true;
          console.log('[OptimizedMultiplayer] Removed stale player after 30min:', player.name);
        } else if (timeSinceUpdate > 600000) { // Log warning after 10 minutes
          console.log('[OptimizedMultiplayer] Player inactive for', Math.floor(timeSinceUpdate / 60000), 'minutes:', player.name);
        }
      });
      
      if (removed) {
        setPlayerIds(new Set(playersDataRef.current.keys()));
      }
    }, 30000); // Check every 30 seconds instead of every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const sendMovement = useCallback((sourceX: number, sourceY: number, destX: number, destY: number, direction: string) => {
    if (!playerData) return;
    
    lastPlayerPosition.current = { x: destX, y: destY };
    
    positionService.current?.insertPosition({
      player_id: playerData.userId,
      x: destX,
      y: destY,
      source_x: sourceX,
      source_y: sourceY,
      direction,
      model_type: playerData.characterModel || 'default',
      screen_name: playerData.username || 'Player'
    });
  }, [playerData]);

  const sendChatMessage = useCallback((message: string) => {
    if (!playerData) return;
    
    chatService.current?.insertChatMessage({
      player_id: playerData.userId,
      message,
      x: lastPlayerPosition.current.x,
      y: lastPlayerPosition.current.y,
      screen_name: playerData.username || 'Player'
    });
  }, [playerData]);

  // Get players for rendering (convert ref to array)
  const getPlayers = useCallback(() => {
    return Array.from(playersDataRef.current.values());
  }, []);

  return {
    players: playersDataRef.current,
    playerIds,
    getPlayers,
    sendMovement,
    sendChatMessage,
    isConnected,
    playersCount: playerIds.size + 1 // Include current player
  };
};