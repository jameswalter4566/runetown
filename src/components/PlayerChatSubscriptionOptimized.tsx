import React, { useEffect, useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import { supabase } from '@/integrations/supabase/client';

// Global shared channel for all players
let sharedChannel: any = null;
let channelSubscribers = 0;

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
  const lastMessageIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!playerId) return;
    
    // Subscribe to the shared channel
    const setupSubscription = () => {
      if (!sharedChannel) {
        console.log(`[PlayerChatSubscription] Creating shared channel`);
        sharedChannel = supabase
          .channel('shared-all-player-chats')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'player_chats'
            },
            (payload) => {
              // Broadcast to all listeners
              window.dispatchEvent(new CustomEvent('chat-message', { detail: payload.new }));
            }
          )
          .subscribe((status) => {
            console.log(`[PlayerChatSubscription] Shared channel status:`, status);
          });
      }
      
      channelSubscribers++;
    };
    
    setupSubscription();
    
    // Listen for chat messages
    const handleChatMessage = (event: CustomEvent) => {
      const newMsg = event.detail as ChatMessage;
      
      // Check if this message is from the player we're tracking
      if (newMsg.player_id === playerId) {
        // Prevent duplicate processing
        if (lastMessageIdRef.current === newMsg.id) return;
        lastMessageIdRef.current = newMsg.id;
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // Set the new message
        setCurrentMessage(newMsg.message);
        
        // Set new timeout to clear message after 3 seconds
        timeoutRef.current = setTimeout(() => {
          setCurrentMessage(null);
          timeoutRef.current = null;
        }, 3000);
      }
    };
    
    window.addEventListener('chat-message', handleChatMessage as any);
    
    // Cleanup
    return () => {
      window.removeEventListener('chat-message', handleChatMessage as any);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Only remove channel if this is the last subscriber
      channelSubscribers--;
      if (channelSubscribers === 0 && sharedChannel) {
        console.log(`[PlayerChatSubscription] Removing shared channel`);
        supabase.removeChannel(sharedChannel);
        sharedChannel = null;
      }
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