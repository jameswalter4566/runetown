import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import './RuneScapeChat.css';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  penguinName: string;
  penguinColor: string;
  userId: string;
  channel: 'all' | 'game' | 'public' | 'private' | 'channel' | 'clan' | 'trade';
}

interface RuneScapeChatProps {
  userId: string | null;
  username: string;
  penguinColor: string;
  currentMap: string;
  messages: Message[];
  onSendMessage: (text: string, channel: string) => void;
}

export const RuneScapeChat: React.FC<RuneScapeChatProps> = ({
  userId,
  username,
  penguinColor,
  currentMap,
  messages,
  onSendMessage
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'game' | 'public' | 'private' | 'channel' | 'clan' | 'trade'>('all');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'game', label: 'Game' },
    { id: 'public', label: 'Public' },
    { id: 'private', label: 'Private' },
    { id: 'channel', label: 'Channel' },
    { id: 'clan', label: 'Clan' },
    { id: 'trade', label: 'Trade' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && userId) {
      onSendMessage(inputText, activeTab);
      setInputText('');
    }
  };

  const filteredMessages = activeTab === 'all' 
    ? messages 
    : messages.filter(msg => msg.channel === activeTab);

  return (
    <div 
      className="ui-layer runescape-chat"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '160px',
        backgroundColor: '#494034',
        borderTop: '2px solid #000',
        borderLeft: '2px solid #000',
        borderRight: '2px solid #000',
        boxShadow: 'inset 1px 1px 0 #6B5D54, inset -1px -1px 0 #2A2117'
      }}
    >
      {/* Tab bar */}
      <div 
        style={{
          display: 'flex',
          height: '30px',
          backgroundColor: '#3E352B',
          borderBottom: '1px solid #000'
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: tab.id === 'all' ? '0 0 auto' : 1,
              padding: '0 10px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#494034' : '#2A2117',
              color: activeTab === tab.id ? '#FFFF00' : '#A59D94',
              fontSize: '12px',
              fontFamily: 'Arial, sans-serif',
              cursor: 'pointer',
              borderRight: '1px solid #000',
              borderTop: activeTab === tab.id ? '2px solid #6B5D54' : 'none',
              borderBottom: activeTab === tab.id ? 'none' : '1px solid #000',
              boxShadow: activeTab === tab.id 
                ? 'inset 1px 1px 0 #6B5D54, inset -1px 0 0 #2A2117' 
                : 'none',
              minWidth: tab.id === 'all' ? '40px' : 'auto'
            }}
          >
            {tab.label}
          </button>
        ))}
        
        {/* Report button */}
        <button
          style={{
            flex: '0 0 auto',
            padding: '0 15px',
            border: 'none',
            backgroundColor: '#8B0000',
            color: '#FFFFFF',
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
            marginLeft: 'auto',
            borderLeft: '1px solid #000',
            boxShadow: 'inset 1px 1px 0 #CD5C5C, inset -1px -1px 0 #4B0000'
          }}
          onClick={() => console.log('Report clicked')}
        >
          Report
        </button>
      </div>

      {/* Messages area */}
      <div
        className="runescape-chat-messages"
        style={{
          height: 'calc(100% - 30px)',
          overflowY: 'auto',
          padding: '5px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          color: '#000000',
          backgroundColor: '#F0E6D2',
          boxShadow: 'inset -1px -1px 0 #6B5D54, inset 1px 1px 0 #2A2117'
        }}
      >
        {filteredMessages.length === 0 && (
          <div style={{ color: '#000000' }}>
            [{new Date().toLocaleTimeString('en-US', { hour12: false })}] Welcome to Old School Runescape.
            <br />
            Countlan: 4
          </div>
        )}
        {filteredMessages.map((message) => {
          const time = new Date(message.timestamp).toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          return (
            <div key={message.id} style={{ marginBottom: '2px' }}>
              <span style={{ color: '#000000' }}>[{time}]</span>{' '}
              <span style={{ fontWeight: 'bold' }}>{message.penguinName}:</span>{' '}
              <span>{message.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - hidden as it's not in the reference image */}
      <form onSubmit={handleSubmit} style={{ display: 'none' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Press Enter to chat..."
          style={{
            width: '100%',
            padding: '5px',
            border: 'none',
            backgroundColor: '#F0E6D2',
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px'
          }}
        />
      </form>
    </div>
  );
};