import React, { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage3D {
  id: string;
  message: string;
  x: number;
  y: number;
  screen_name: string;
  created_at: string;
  player_id: string;
}

export function ChatMessages3D() {
  const [messages, setMessages] = useState<ChatMessage3D[]>([]);
  
  useEffect(() => {
    // Fetch recent messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('player_chats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Show last 50 messages
        
      if (data && !error) {
        // Filter messages to only show those from the last 3 seconds
        const recentMessages = data.filter(msg => {
          const msgTime = new Date(msg.created_at).getTime();
          const now = Date.now();
          return now - msgTime < 3000; // 3 seconds
        });
        setMessages(recentMessages);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('chat-messages-3d')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'player_chats' },
        (payload) => {
          console.log('[ChatMessages3D] New message from database:', payload.new);
          const newMsg = payload.new as ChatMessage3D;
          
          setMessages(prev => {
            // Don't add duplicates
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (exists) return prev;
            
            return [...prev, newMsg];
          });
          
          // Remove message after 3 seconds
          setTimeout(() => {
            setMessages(prev => prev.filter(msg => msg.id !== newMsg.id));
          }, 3000);
        }
      )
      .subscribe((status) => {
        console.log('[ChatMessages3D] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[ChatMessages3D] Successfully subscribed to real-time updates');
        }
      });
      
    // Clean up old messages every 5 seconds
    const cleanupInterval = setInterval(() => {
      setMessages(prev => prev.filter(msg => {
        const msgTime = new Date(msg.created_at).getTime();
        const now = Date.now();
        return now - msgTime < 3000;
      }));
    }, 5000);
      
    return () => {
      clearInterval(cleanupInterval);
      supabase.removeChannel(channel);
    };
  }, []);
  
  return (
    <>
      {messages.map(msg => (
        <Html
          key={msg.id}
          position={[msg.x, 20, msg.y]} // Y is height, Z is the stored y coordinate
          center
          style={{
            fontSize: '14px',
            pointerEvents: 'none',
            transition: 'opacity 0.5s',
            opacity: 1
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
            <div style={{ fontSize: '10px', color: '#ffcc00', marginBottom: '2px' }}>
              {msg.screen_name}
            </div>
            {msg.message}
          </div>
        </Html>
      ))}
    </>
  );
}