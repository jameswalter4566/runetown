import React, { useEffect, useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import { supabase } from '@/integrations/supabase/client';

interface PlayerChatSubscriptionProps {
  playerId: string;
  position?: [number, number, number];
}

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  player_id: string;
  screen_name: string;
}

export function PlayerChatSubscription({ playerId, position = [0, 22, 0] }: PlayerChatSubscriptionProps) {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!playerId) return;
    
    console.log(`[PlayerChatSubscription] Setting up subscription for player: ${playerId}`);
    
    // Subscribe to ALL chat messages and filter client-side
    const channel = supabase
      .channel(`all-player-chats-${playerId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'player_chats'
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          // Check if this message is from the player we're tracking
          if (newMsg.player_id === playerId) {
            console.log(`[PlayerChatSubscription] New message for player ${playerId}:`, newMsg.message);
            
            // Clear any existing timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            // Set the new message
            setCurrentMessage(newMsg.message);
            
            // Set new timeout to clear message after 3 seconds
            timeoutRef.current = setTimeout(() => {
              console.log(`[PlayerChatSubscription] Clearing message for player ${playerId}`);
              setCurrentMessage(null);
              timeoutRef.current = null;
            }, 3000);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[PlayerChatSubscription] Subscription status for ${playerId}:`, status);
      });
    
    // Cleanup
    return () => {
      console.log(`[PlayerChatSubscription] Cleaning up subscription for player: ${playerId}`);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [playerId]);
  
  if (!currentMessage) return null;
  
  return (
    <Html 
      position={position} 
      center
      style={{
        fontSize: '14px',
        pointerEvents: 'none'
      }}
    >
      <div style={{
        color: 'yellow',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
        whiteSpace: 'nowrap',
        userSelect: 'none'
      }}>
        {currentMessage}
      </div>
    </Html>
  );
}