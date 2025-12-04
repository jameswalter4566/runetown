import React from 'react';
import { Html } from '@react-three/drei';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  penguinName?: string;
  penguinColor?: string;
}

interface ChatBubbleProps {
  messages: Message[];
  showName?: boolean;
}

export function ChatBubble({ messages, showName = false }: ChatBubbleProps) {
  if (messages.length === 0) return null;

  return (
    <Html position={[0, 0.8, 0]} center distanceFactor={10}>
      <div style={{ pointerEvents: 'none', position: 'relative', height: '0' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column-reverse', 
          alignItems: 'center', 
          gap: '8px',
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          {messages.map((message, index) => (
            <div 
              key={message.id}
              style={{
                backgroundColor: 'rgba(245, 245, 245, 0.85)',
                border: '2px solid rgb(128, 128, 128)',
                borderRadius: '12px',
                padding: '10px 25px',
                maxWidth: '500px',
                minWidth: '150px',
                position: 'relative',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              <div>
                {showName && message.penguinName && (
                  <div 
                    style={{
                      color: message.penguinColor ? `#${message.penguinColor}` : '#4A90E2',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    {message.penguinName}:
                  </div>
                )}
                <div 
                  style={{
                    color: '#000000',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'center',
                    wordBreak: 'normal',
                    lineHeight: '1.4',
                    whiteSpace: 'normal',
                  }}
                >
                  {message.text}
                </div>
              </div>
              
              {/* Chat bubble tail - only on the bottom message (most recent) */}
              {index === 0 && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '0',
                      height: '0',
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderTop: '8px solid rgb(128, 128, 128)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-5px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '0',
                      height: '0',
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '6px solid rgba(245, 245, 245, 0.85)',
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Html>
  );
}