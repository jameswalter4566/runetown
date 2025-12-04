import React from 'react';
import { useRealtimeMessagesContext } from '@/contexts/RealtimeMessagesContext';

export const RealtimeMessageFeed: React.FC = () => {
  const { messages, isLoading, error } = useRealtimeMessagesContext();

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '200px', // Above the chat box
        left: '10px',
        width: '480px',
        height: '150px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #FFD700',
        borderRadius: '5px',
        padding: '10px',
        overflowY: 'auto',
        zIndex: 999,
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#00FF00'
      }}
    >
      <div style={{ marginBottom: '5px', color: '#FFD700', fontWeight: 'bold' }}>
        📡 REAL-TIME DATABASE FEED ({messages.length} messages)
      </div>
      
      {error && (
        <div style={{ color: '#FF0000' }}>
          ❌ Error: {error}
        </div>
      )}
      
      {isLoading && (
        <div style={{ color: '#FFFF00' }}>
          ⏳ Loading messages...
        </div>
      )}
      
      {messages.length === 0 && !isLoading && (
        <div style={{ color: '#808080' }}>
          No messages in database yet...
        </div>
      )}
      
      {messages.map(msg => (
        <div key={msg.id} style={{ marginBottom: '5px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
          <div style={{ color: '#00FFFF' }}>
            [{new Date(msg.created_at).toLocaleTimeString()}] {msg.sender_username || 'Unknown'}:
          </div>
          <div style={{ color: '#FFFFFF', marginLeft: '10px' }}>
            {msg.message}
          </div>
          <div style={{ color: '#666666', fontSize: '10px', marginLeft: '10px' }}>
            ID: {msg.id} | Sender: {msg.sender_id}
          </div>
        </div>
      ))}
    </div>
  );
};