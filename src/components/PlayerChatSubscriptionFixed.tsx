import React, { useEffect, useState, useRef, useCallback } from 'react';
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

interface DisplayMessage {
  id: string;
  text: string;
  timestamp: number;
}

export function PlayerChatSubscription({ playerId, position = [0, 22, 0] }: PlayerChatSubscriptionProps) {
  const [currentMessage, setCurrentMessage] = useState<DisplayMessage | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to clear message only if it's the same message (by ID)
  const clearSpecificMessage = useCallback((messageId: string) => {
    setCurrentMessage(prev => {
      // Only clear if it's the same message
      if (prev && prev.id === messageId) {
        console.log(`[PlayerChatSubscription] Clearing old message ${messageId} for player ${playerId}`);
        return null;
      }
      // Otherwise keep the current message (it's a newer one)
      return prev;
    });
  }, [playerId]);
  
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
        const messageId = newMsg.id;
        const displayMsg: DisplayMessage = {
          id: messageId,
          text: newMsg.message,
          timestamp: Date.now()
        };
        
        console.log(`[PlayerChatSubscription] New message for player ${playerId}:`, displayMsg.text);
        
        // Clear any existing timer
        if (messageTimerRef.current) {
          clearTimeout(messageTimerRef.current);
          messageTimerRef.current = null;
        }
        
        // Set the new message
        setCurrentMessage(displayMsg);
        
        // Set timer to clear THIS SPECIFIC message after 3 seconds
        messageTimerRef.current = setTimeout(() => {
          clearSpecificMessage(messageId);
          messageTimerRef.current = null;
        }, 3000);
      }
    };
    
    window.addEventListener('chat-message', handleChatMessage as any);
    
    // Cleanup
    return () => {
      window.removeEventListener('chat-message', handleChatMessage as any);
      
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      
      // Only remove channel if this is the last subscriber
      channelSubscribers--;
      if (channelSubscribers === 0 && sharedChannel) {
        console.log(`[PlayerChatSubscription] Removing shared channel`);
        supabase.removeChannel(sharedChannel);
        sharedChannel = null;
      }
    };
  }, [playerId, clearSpecificMessage]);
  
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
        {currentMessage.text}
      </div>
    </Html>
  );
}