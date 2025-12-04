import React, { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { supabase } from '@/integrations/supabase/client';

interface PlayerChatDisplayProps {
  playerId: string;
  position?: [number, number, number];
}

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
}

export function PlayerChatDisplay({ playerId, position = [0, 17, 0] }: PlayerChatDisplayProps) {
  const [latestMessage, setLatestMessage] = useState<ChatMessage | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!playerId) return;
    
    // Subscribe to chat messages for this specific player
    const channel = supabase
      .channel(`player-chat-${playerId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'player_chats',
          filter: `player_id=eq.${playerId}`
        },
        (payload) => {
          console.log(`[PlayerChatDisplay] New message for player ${playerId}:`, payload.new);
          const newMsg = payload.new as ChatMessage;
          
          // Clear previous timeout
          if (messageTimeout) {
            clearTimeout(messageTimeout);
          }
          
          // Set the new message
          setLatestMessage(newMsg);
          
          // Set timeout to clear message after 5 seconds
          const timeout = setTimeout(() => {
            setLatestMessage(null);
          }, 5000);
          
          setMessageTimeout(timeout);
        }
      )
      .subscribe((status) => {
        console.log(`[PlayerChatDisplay] Subscription status for ${playerId}:`, status);
      });
      
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [playerId]);
  
  if (!latestMessage) return null;
  
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'yellow',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
        whiteSpace: 'nowrap',
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {latestMessage.message}
      </div>
    </Html>
  );
}