import { useEffect, useState, useCallback, useRef } from 'react';
import { PlayerPositionService, PlayerPosition } from '../services/playerPositionService';
import { PlayerChatService, PlayerChat } from '../services/playerChatService';
import { supabase } from '../lib/supabase';

export interface Player {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  targetPosition?: { x: number; y: number; z: number };
  sourcePosition?: { x: number; y: number; z: number };
  movementStartTime?: number;
  direction: string;
  modelType: string;
  lastUpdate: number;
  chatMessage?: string;
  chatTimestamp?: number;
  isMoving?: boolean;
}

export const useDatabaseMultiplayer = (playerData?: { userId?: string; username?: string; characterModel?: string }) => {
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastPlayerPosition, setLastPlayerPosition] = useState<{ x: number; y: number }>({ x: -80, y: 0 });
  const positionService = useRef(PlayerPositionService.getInstance());
  const chatService = useRef(PlayerChatService.getInstance());
  const unsubscribePositionsRef = useRef<(() => void) | null>(null);
  const unsubscribeChatsRef = useRef<(() => void) | null>(null);
  const playersRef = useRef<Map<string, Player>>(new Map());

  // Handle player movement
  const sendMovement = useCallback(async (sourceX: number, sourceY: number, destX: number, destY: number, direction: string) => {
    if (!playerData?.userId) return;

    // Store last position for chat messages
    setLastPlayerPosition({ x: destX, y: destY });

    try {
      await positionService.current.insertPosition({
        player_id: playerData.userId,
        x: destX,
        y: destY,
        source_x: sourceX,
        source_y: sourceY,
        direction,
        model_type: playerData.characterModel || 'default',
        screen_name: playerData.username || 'Player'
      });
    } catch (error) {
      console.error('[DatabaseMultiplayer] Failed to send movement:', error);
    }
  }, [playerData]);

  // Handle sending chat messages
  const sendChatMessage = useCallback(async (message: string) => {
    if (!playerData?.userId || !message.trim()) return;

    try {
      await chatService.current.sendChat({
        player_id: playerData.userId,
        message: message.trim(),
        x: lastPlayerPosition.x,
        y: lastPlayerPosition.y,
        screen_name: playerData.username || 'Player'
      });
    } catch (error) {
      console.error('[DatabaseMultiplayer] Failed to send chat:', error);
    }
  }, [playerData, lastPlayerPosition]);

  // Subscribe to position updates
  useEffect(() => {
    if (!playerData?.userId) return;

    const setupSubscription = async () => {
      try {
        // Load initial positions
        const positions = await positionService.current.getLatestPositions();
        const latestPositions = new Map<string, PlayerPosition>();
        
        // Get only the latest position for each player
        positions.forEach(pos => {
          const existing = latestPositions.get(pos.player_id);
          if (!existing || new Date(pos.timestamp) > new Date(existing.timestamp)) {
            latestPositions.set(pos.player_id, pos);
          }
        });

        // Fetch character models from users table for all players
        const playerIds = Array.from(latestPositions.keys()).filter(id => id !== playerData?.userId);
        let userModels = new Map<string, string>();
        
        if (playerIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, character_model')
            .in('id', playerIds);
          
          if (users) {
            users.forEach(user => {
              if (user.character_model) {
                userModels.set(user.id, user.character_model);
              }
            });
          }
        }

        // Convert to Player format
        const initialPlayers = new Map<string, Player>();
        latestPositions.forEach((pos, playerId) => {
          if (playerId !== playerData?.userId) {
            initialPlayers.set(playerId, {
              id: playerId,
              name: pos.screen_name,
              position: { x: pos.x, y: 0, z: pos.y },
              targetPosition: { x: pos.x, y: 0, z: pos.y },
              sourcePosition: pos.source_x && pos.source_y ? { x: pos.source_x, y: 0, z: pos.source_y } : { x: pos.x, y: 0, z: pos.y },
              movementStartTime: pos.timestamp ? new Date(pos.timestamp).getTime() : Date.now(),
              direction: pos.direction,
              modelType: userModels.get(playerId) || 'red_blue_white.glb', // Use actual model from users table
              lastUpdate: Date.now(),
              isMoving: false
            });
          }
        });
        
        setPlayers(initialPlayers);
        playersRef.current = initialPlayers;
        console.log('[DatabaseMultiplayer] Loaded initial positions for', initialPlayers.size, 'players');

        // Load initial chat messages
        const recentChats = await chatService.current.getRecentChats();
        recentChats.forEach(chat => {
          setPlayers(prev => {
            const updated = new Map(prev);
            const player = updated.get(chat.player_id);
            if (player) {
              player.chatMessage = chat.message;
              player.chatTimestamp = new Date(chat.timestamp || '').getTime();
            }
            return updated;
          });
        });

        // Subscribe to real-time position updates, excluding our own
        unsubscribePositionsRef.current = positionService.current.subscribeToPositions(async (payload) => {
          const newPos = payload.new as PlayerPosition;
          
          // This should never happen now that we filter in the service
          if (newPos.player_id === playerData?.userId) {
            // Just update our last known position for heartbeat
            setLastPlayerPosition({ x: newPos.x, y: newPos.y });
            return;
          }

          // For new players, fetch their character_model from users table FIRST
          let characterModel = 'red_blue_white.glb';
          const currentPlayers = playersRef.current || new Map();
          const existingPlayer = currentPlayers.get(newPos.player_id);
          
          if (!existingPlayer) {
            const { data: userData } = await supabase
              .from('users')
              .select('character_model')
              .eq('id', newPos.player_id)
              .single();
            
            if (userData?.character_model) {
              characterModel = userData.character_model;
              console.log('[DatabaseMultiplayer] Fetched character model for', newPos.screen_name, ':', characterModel);
            }
          } else {
            characterModel = existingPlayer.modelType;
          }

          // Use functional update with proper synchronization
          setPlayers(prev => {
            // CRITICAL: Clone the map to avoid mutations
            const updated = new Map(prev);
            const now = Date.now();
            
            // Check if we should skip this update (duplicate or stale)
            const existingPlayerData = updated.get(newPos.player_id);
            if (existingPlayerData && existingPlayerData.lastUpdate > now - 50) {
              console.log('[DatabaseMultiplayer] Skipping duplicate update for', newPos.screen_name);
              return prev; // Return unchanged to prevent unnecessary re-renders
            }
            
            // Use positions directly from the database update
            const dbSourceX = newPos.source_x ?? newPos.x;
            const dbSourceY = newPos.source_y ?? newPos.y;
            
            updated.set(newPos.player_id, {
              id: newPos.player_id,
              name: newPos.screen_name,
              position: { x: dbSourceX, y: 0, z: dbSourceY }, // Start from source position
              targetPosition: { x: newPos.x, y: 0, z: newPos.y },
              sourcePosition: { x: dbSourceX, y: 0, z: dbSourceY },
              movementStartTime: newPos.timestamp ? new Date(newPos.timestamp).getTime() : now,
              direction: newPos.direction,
              modelType: characterModel, // Use model from users table
              lastUpdate: now,
              isMoving: true // Will be calculated in render loop
            });
            
            console.log('[DatabaseMultiplayer] Position update processed:', {
              player: newPos.screen_name,
              playerId: newPos.player_id,
              from: `(${dbSourceX.toFixed(2)}, ${dbSourceY.toFixed(2)})`,
              to: `(${newPos.x.toFixed(2)}, ${newPos.y.toFixed(2)})`,
              timestamp: newPos.timestamp,
              totalPlayers: updated.size,
              currentTime: now
            });
            
            // Update ref AFTER state update
            playersRef.current = updated;
            return updated;
          });
        }, playerData?.userId);

        // Subscribe to real-time chat updates
        unsubscribeChatsRef.current = chatService.current.subscribeToChatMessages((payload) => {
          const newChat = payload.new as PlayerChat;
          
          // Update player's chat message
          setPlayers(prev => {
            const updated = new Map(prev);
            
            // Skip our own chat messages - they're handled locally
            if (newChat.player_id === playerData?.userId) {
              return prev;
            } else {
              // Update existing player's chat
              const player = updated.get(newChat.player_id);
              if (player) {
                player.chatMessage = newChat.message;
                player.chatTimestamp = new Date(newChat.timestamp || '').getTime();
              } else {
                // Create temporary player at chat position if they don't exist
                updated.set(newChat.player_id, {
                  id: newChat.player_id,
                  name: newChat.screen_name,
                  position: { x: newChat.x, y: 0, z: newChat.y },
                  direction: 'S',
                  modelType: 'default',
                  lastUpdate: Date.now(),
                  chatMessage: newChat.message,
                  chatTimestamp: new Date(newChat.timestamp || '').getTime()
                });
              }
            }
            
            return updated;
          });
        });

        setIsConnected(true);
        console.log('[DatabaseMultiplayer] Connected to position and chat updates');
        
        // Send initial position to announce presence
        console.log('[DatabaseMultiplayer] Sending initial position to announce presence');
        await positionService.current.insertPosition({
          player_id: playerData.userId,
          x: lastPlayerPosition.x || -80,
          y: lastPlayerPosition.y || 0,
          source_x: lastPlayerPosition.x || -80,
          source_y: lastPlayerPosition.y || 0,
          direction: 'S',
          model_type: playerData.characterModel || 'default',
          screen_name: playerData.username || 'Player'
        });
      } catch (error) {
        console.error('[DatabaseMultiplayer] Failed to setup subscription:', error);
        setIsConnected(false);
      }
    };

    setupSubscription();

    // Cleanup function
    return () => {
      if (unsubscribePositionsRef.current) {
        unsubscribePositionsRef.current();
        unsubscribePositionsRef.current = null;
      }
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current();
        unsubscribeChatsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [playerData]);

  // Heartbeat system - send position update every 20 seconds to maintain presence
  useEffect(() => {
    if (!playerData || !positionService.current) return;
    
    const heartbeatInterval = setInterval(() => {
      // Always use last known position for heartbeat
      if (lastPlayerPosition.x !== -80 || lastPlayerPosition.y !== 0) {
        console.log('[DatabaseMultiplayer] Sending heartbeat to maintain presence');
        positionService.current?.insertPosition({
          player_id: playerData.userId,
          x: lastPlayerPosition.x,
          y: lastPlayerPosition.y,
          source_x: lastPlayerPosition.x,
          source_y: lastPlayerPosition.y,
          direction: 'S',
          model_type: playerData.characterModel || 'default',
          screen_name: playerData.username || 'Player'
        });
      }
    }, 20000); // Every 20 seconds
    
    return () => clearInterval(heartbeatInterval);
  }, [playerData]);

  // Clean up stale players and expired chat messages
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPlayers(prev => {
        const updated = new Map(prev);
        let removed = 0;
        let expiredChats = 0;
        
        updated.forEach((player, id) => {
          // Remove players that haven't updated in 5 minutes (300000ms)
          // This is much more lenient to prevent disconnections when standing still
          if (now - player.lastUpdate > 300000) {
            updated.delete(id);
            removed++;
          } else {
            // Clear expired chat messages (older than 5 seconds)
            if (player.chatMessage && player.chatTimestamp && 
                now - player.chatTimestamp > 5000) {
              player.chatMessage = undefined;
              player.chatTimestamp = undefined;
              expiredChats++;
            }
          }
        });
        
        if (removed > 0) {
          console.log('[DatabaseMultiplayer] Removed', removed, 'stale players');
        }
        if (expiredChats > 0) {
          console.log('[DatabaseMultiplayer] Expired', expiredChats, 'chat messages');
        }
        
        return updated;
      });
    }, 1000); // Check every second for chat expiration

    return () => clearInterval(interval);
  }, []);

  return {
    players,
    sendMovement,
    sendChatMessage,
    isConnected,
    playersCount: players.size + 1 // Include current player in count
  };
};