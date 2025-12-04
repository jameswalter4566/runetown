import React, { createContext, useContext, ReactNode } from 'react';
import { useRealtimeMessages, ChatMessage } from '@/hooks/useRealtimeMessages';

interface RealtimeMessagesContextType {
  messages: ChatMessage[];
  sendMessage: (message: string, userId: string) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  refreshMessages: () => Promise<void>;
}

const RealtimeMessagesContext = createContext<RealtimeMessagesContextType | null>(null);

export function RealtimeMessagesProvider({ children }: { children: ReactNode }) {
  const realtimeData = useRealtimeMessages();
  
  return (
    <RealtimeMessagesContext.Provider value={realtimeData}>
      {children}
    </RealtimeMessagesContext.Provider>
  );
}

export function useRealtimeMessagesContext() {
  const context = useContext(RealtimeMessagesContext);
  if (!context) {
    throw new Error('useRealtimeMessagesContext must be used within RealtimeMessagesProvider');
  }
  return context;
}