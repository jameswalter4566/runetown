import React, { useState, useRef, useEffect } from 'react';
import './RunescapeChatBox.css';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  type: 'system' | 'player' | 'game';
  sender?: string;
  message: string;
  color?: string;
  timestamp: Date;
}

interface RunescapeChatBoxProps {
  onClose?: () => void;
  onSendMessage?: (message: string) => void;
  username: string;
  userId?: string;
  playerPosition?: { x: number; z: number };
}

export const RunescapeChatBox: React.FC<RunescapeChatBoxProps> = ({ onClose, onSendMessage, username, userId, playerPosition }) => {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      message: 'Welcome to RuneScape.',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'system',
      message: 'You have been given a Beach Party ticket! Head to the Lumbridge Beach to redeem it for some free items!',
      timestamp: new Date()
    }
  ]);
  
  // Subscribe to player_chats table
  useEffect(() => {
    if (!userId) return;
    
    // Get recent chats from last 5 minutes
    const fetchRecentChats = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('player_chats')
        .select('*')
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: true });
        
      if (data && !error) {
        const chats = data.map(chat => ({
          id: chat.id,
          type: 'player' as const,
          sender: chat.screen_name,
          message: chat.message,
          color: 'white',
          timestamp: new Date(chat.created_at)
        }));
        setLocalMessages(prev => [...prev.slice(0, 2), ...chats]); // Keep system messages
      }
    };
    
    fetchRecentChats();
    
    // Subscribe to new chats
    const channel = supabase
      .channel('player-chats-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'player_chats' },
        (payload) => {
          console.log('[Chat] New message from database:', payload.new);
          const newChat = payload.new as any;
          
          // Don't add duplicate messages
          setLocalMessages(prev => {
            const exists = prev.some(msg => msg.id === newChat.id);
            if (exists) return prev;
            
            return [...prev, {
              id: newChat.id,
              type: 'player' as const,
              sender: newChat.screen_name,
              message: newChat.message,
              color: 'white',
              timestamp: new Date(newChat.created_at || new Date())
            }];
          });
        }
      )
      .subscribe((status) => {
        console.log('[Chat] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Chat] Successfully subscribed to real-time updates');
        }
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  const allMessages = localMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'game' | 'public' | 'private' | 'channel' | 'clan' | 'trade'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() && userId) {
      const messageText = inputValue.trim();
      setInputValue('');
      
      try {
        // Add message to local display immediately
        setLocalMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'player',
          sender: username,
          message: messageText,
          color: 'white',
          timestamp: new Date()
        }]);
        
        // Insert into database for persistence and real-time sync
        const { error } = await supabase
          .from('player_chats')
          .insert({
            player_id: userId,
            message: messageText,
            x: playerPosition?.x || 0,
            y: playerPosition?.z || 0, // Using z as y for 2D position
            screen_name: username
          });
          
        if (error) {
          console.error('Failed to insert chat into database:', error);
          throw error;
        }
        
        // Send to parent for Socket.io chat broadcast (for immediate display above head)
        if (onSendMessage) {
          onSendMessage(messageText);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // Show error message
        setLocalMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          message: 'Failed to send message. Please try again.',
          timestamp: new Date()
        }]);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    if (msg.type === 'system') {
      return (
        <div key={msg.id} className="chat-message system-message">
          {msg.message}
        </div>
      );
    } else if (msg.type === 'player') {
      return (
        <div key={msg.id} className="chat-message player-message">
          <span className="player-name">{msg.sender}:</span>
          <span className="message-text" style={{ color: msg.color || 'white' }}>
            {' ' + msg.message}
          </span>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    // Ensure Arial font is used and add custom scrollbar styling
    const style = document.createElement('style');
    style.innerHTML = `
      /* Remove bold font weight for thinner appearance */
      div[style*="fontWeight: 'bold'"] {
        font-weight: normal !important;
      }
      
      /* Custom Scrollbar - RuneScape style */
      .runescape-messages::-webkit-scrollbar {
        width: 16px;
      }
      
      .runescape-messages::-webkit-scrollbar-track {
        background: #3C3124;
        border: 1px solid #8B7355;
        box-shadow: inset 0 0 0 1px #2A2117;
      }
      
      /* Disable clicking on track to scroll */
      .runescape-messages::-webkit-scrollbar-track-piece {
        background: #3C3124;
        border: 1px solid #8B7355;
        box-shadow: inset 0 0 0 1px #2A2117;
      }
      
      .runescape-messages::-webkit-scrollbar-thumb {
        background: #6B5D4F;
        border: 1px solid #8B7355;
        box-shadow: inset 0 0 0 1px #4A3C2E;
        border-radius: 0;
        min-height: 20px;
      }
      
      .runescape-messages::-webkit-scrollbar-thumb:hover {
        background: #7B6D5F;
      }
      
      /* Single scroll button styles */
      .runescape-messages::-webkit-scrollbar-button:single-button {
        height: 17px;
        background: #6B5D4F;
        border: 1px solid #8B7355;
        display: block;
        position: relative;
        box-shadow: inset 0 0 0 1px #4A3C2E;
      }
      
      .runescape-messages::-webkit-scrollbar-button:single-button:hover {
        background: #7B6D5F;
      }
      
      .runescape-messages::-webkit-scrollbar-button:single-button:vertical:decrement {
        border-bottom: none;
      }
      
      .runescape-messages::-webkit-scrollbar-button:single-button:vertical:increment {
        border-top: none;
      }
      
      /* Hide double button areas */
      .runescape-messages::-webkit-scrollbar-button:double-button {
        display: none;
      }
      
      /* Arrow for up button */
      .runescape-messages::-webkit-scrollbar-button:single-button:vertical:decrement::after {
        content: '▲';
        display: block;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #1A1511;
        font-size: 8px;
        line-height: 1;
      }
      
      /* Arrow for down button */
      .runescape-messages::-webkit-scrollbar-button:single-button:vertical:increment::after {
        content: '▼';
        display: block;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #1A1511;
        font-size: 8px;
        line-height: 1;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '500px',
        height: '160px',
        backgroundColor: '#494034',
        borderTop: '2px solid #000',
        borderLeft: '2px solid #000',
        borderRight: '2px solid #000',
        boxShadow: 'inset 1px 1px 0 #6B5D54, inset -1px -1px 0 #2A2117',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Messages area */}
      <div
        className="runescape-messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '5px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          fontWeight: 'normal',
          color: '#000000',
          backgroundColor: '#F0E6D2',
          boxShadow: 'inset -1px -1px 0 #6B5D54, inset 1px 1px 0 #2A2117'
        }}
      >
        {allMessages.length === 0 && (
          <div style={{ color: '#000000' }}>
            [{new Date().toLocaleTimeString('en-US', { hour12: false })}] Welcome to Old School Runescape.
            <br />
            Countlan: 4
          </div>
        )}
        {allMessages.map((message) => {
          const time = new Date(message.timestamp).toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          return (
            <div key={message.id} style={{ marginBottom: '2px' }}>
              {message.type === 'player' && (
                <>
                  <span style={{ fontWeight: 'normal' }}>{message.sender}:</span>{' '}
                  <span>{message.message}</span>
                </>
              )}
              {message.type === 'system' && (
                <span>{message.message}</span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div 
        style={{
          height: '25px',
          backgroundColor: '#494034',
          borderTop: '1px solid #000',
          padding: '2px'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Press Enter to chat..."
          maxLength={120}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#F0E6D2',
            color: '#000000',
            fontSize: '11px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            padding: '2px 5px',
            outline: 'none',
            boxShadow: 'inset 1px 1px 0 #2A2117, inset -1px -1px 0 #6B5D54'
          }}
        />
      </div>
      
      {/* Tab bar - at the bottom */}
      <div 
        style={{
          display: 'flex',
          height: '34px',
          backgroundColor: '#3E352B',
          borderTop: '1px solid #000'
        }}
      >
        <button
          onClick={() => setActiveTab('all')}
          style={{
            flex: 1,
            height: '34px',
            padding: '0 2px',
            border: 'none',
            backgroundColor: activeTab === 'all' ? '#494034' : '#2A2117',
            fontSize: '10px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            cursor: 'pointer',
            borderRight: '1px solid #000',
            borderTop: activeTab === 'all' ? '2px solid #6B5D54' : 'none',
            borderBottom: activeTab === 'all' ? 'none' : '1px solid #000',
            boxShadow: activeTab === 'all' 
              ? 'inset 1px 1px 0 #6B5D54, inset -1px 0 0 #2A2117' 
              : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px'
          }}
        >
          <span style={{ color: activeTab === 'all' ? '#FFFFFF' : '#A59D94' }}>All</span>
        </button>
        <button
          onClick={() => setActiveTab('game')}
          style={{
            flex: 1,
            height: '34px',
            padding: '0 2px',
            border: 'none',
            backgroundColor: activeTab === 'game' ? '#494034' : '#2A2117',
            fontSize: '10px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            cursor: 'pointer',
            borderRight: '1px solid #000',
            borderTop: activeTab === 'game' ? '2px solid #6B5D54' : 'none',
            borderBottom: activeTab === 'game' ? 'none' : '1px solid #000',
            boxShadow: activeTab === 'game' 
              ? 'inset 1px 1px 0 #6B5D54, inset -1px 0 0 #2A2117' 
              : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px'
          }}
        >
          <span style={{ color: activeTab === 'game' ? '#FFFFFF' : '#A59D94' }}>Game</span>
          <span style={{ color: '#00FF00', fontSize: '9px' }}>On</span>
        </button>
        <button
          onClick={() => setActiveTab('public')}
          style={{
            flex: 1,
            height: '34px',
            padding: '0 2px',
            border: 'none',
            backgroundColor: activeTab === 'public' ? '#494034' : '#2A2117',
            fontSize: '10px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            cursor: 'pointer',
            borderRight: '1px solid #000',
            borderTop: activeTab === 'public' ? '2px solid #6B5D54' : 'none',
            borderBottom: activeTab === 'public' ? 'none' : '1px solid #000',
            boxShadow: activeTab === 'public' 
              ? 'inset 1px 1px 0 #6B5D54, inset -1px 0 0 #2A2117' 
              : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px'
          }}
        >
          <span style={{ color: activeTab === 'public' ? '#FFFFFF' : '#A59D94' }}>Public</span>
          <span style={{ color: '#00FF00', fontSize: '9px' }}>On</span>
        </button>
        <button
          onClick={() => setActiveTab('private')}
          style={{
            flex: 1,
            height: '34px',
            padding: '0 2px',
            border: 'none',
            backgroundColor: activeTab === 'private' ? '#494034' : '#2A2117',
            fontSize: '10px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            cursor: 'pointer',
            borderRight: '1px solid #000',
            borderTop: activeTab === 'private' ? '2px solid #6B5D54' : 'none',
            borderBottom: activeTab === 'private' ? 'none' : '1px solid #000',
            boxShadow: activeTab === 'private' 
              ? 'inset 1px 1px 0 #6B5D54, inset -1px 0 0 #2A2117' 
              : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px'
          }}
        >
          <span style={{ color: activeTab === 'private' ? '#FFFFFF' : '#A59D94' }}>Private</span>
          <span style={{ color: '#FFFF00', fontSize: '9px' }}>Friends</span>
        </button>
        <button
          onClick={() => setActiveTab('channel')}
          style={{
            flex: 1,
            height: '34px',
            padding: '0 2px',
            border: 'none',
            backgroundColor: activeTab === 'channel' ? '#494034' : '#2A2117',
            fontSize: '10px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            cursor: 'pointer',
            borderRight: '1px solid #000',
            borderTop: activeTab === 'channel' ? '2px solid #6B5D54' : 'none',
            borderBottom: activeTab === 'channel' ? 'none' : '1px solid #000',
            boxShadow: activeTab === 'channel' 
              ? 'inset 1px 1px 0 #6B5D54, inset -1px 0 0 #2A2117' 
              : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px'
          }}
        >
          <span style={{ color: activeTab === 'channel' ? '#FFFFFF' : '#A59D94' }}>Channel</span>
          <span style={{ color: '#00FF00', fontSize: '9px' }}>On</span>
        </button>
        <button
          onClick={() => setActiveTab('clan')}
          style={{
            flex: 1,
            height: '34px',
            padding: '0 2px',
            border: 'none',
            backgroundColor: activeTab === 'clan' ? '#494034' : '#2A2117',
            fontSize: '10px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            cursor: 'pointer',
            borderRight: '1px solid #000',
            borderTop: activeTab === 'clan' ? '2px solid #6B5D54' : 'none',
            borderBottom: activeTab === 'clan' ? 'none' : '1px solid #000',
            boxShadow: activeTab === 'clan' 
              ? 'inset 1px 1px 0 #6B5D54, inset -1px 0 0 #2A2117' 
              : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px'
          }}
        >
          <span style={{ color: activeTab === 'clan' ? '#FFFFFF' : '#A59D94' }}>Clan</span>
          <span style={{ color: '#00FF00', fontSize: '9px' }}>On</span>
        </button>
        <button
          onClick={() => setActiveTab('trade')}
          style={{
            flex: 1,
            height: '34px',
            padding: '0 2px',
            border: 'none',
            backgroundColor: activeTab === 'trade' ? '#494034' : '#2A2117',
            fontSize: '10px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            cursor: 'pointer',
            borderRight: '1px solid #000',
            borderTop: activeTab === 'trade' ? '2px solid #6B5D54' : 'none',
            borderBottom: activeTab === 'trade' ? 'none' : '1px solid #000',
            boxShadow: activeTab === 'trade' 
              ? 'inset 1px 1px 0 #6B5D54, inset -1px 0 0 #2A2117' 
              : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px'
          }}
        >
          <span style={{ color: activeTab === 'trade' ? '#FFFFFF' : '#A59D94' }}>Trade</span>
          <span style={{ color: '#00FF00', fontSize: '9px' }}>On</span>
        </button>
        
        {/* Report button */}
        <button
          style={{
            flex: 1,
            height: '34px',
            padding: '0 2px',
            border: 'none',
            backgroundColor: '#8B0000',
            color: '#FFFFFF',
            fontSize: '10px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            cursor: 'pointer',
            borderLeft: '1px solid #000',
            boxShadow: 'inset 1px 1px 0 #CD5C5C, inset -1px -1px 0 #4B0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => console.log('Report clicked')}
        >
          Report
        </button>
      </div>
    </div>
  );
};

export default RunescapeChatBox;