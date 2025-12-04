import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_username?: string;
  message: string;
  created_at: string;
}

export function useRealtimeMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      console.log('📥 Fetching messages from database...');
      
      // First check if we have Supabase configured
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase configuration');
        setError('Database configuration missing');
        setIsLoading(false);
        return;
      }
      
      // Simple query without the join to ensure we can connect
      const { data: simpleData, error: simpleError, status } = await supabase
        .from('user_messages')
        .select('*')
        .is('recipient_id', null)
        .order('created_at', { ascending: true })
        .limit(100);
        
      console.log('Simple query result:', { 
        data: simpleData, 
        error: simpleError,
        status,
        count: simpleData?.length || 0
      });
      
      if (simpleError) {
        console.error('❌ Simple query error:', simpleError);
        setError(`Database error: ${simpleError.message}`);
        setIsLoading(false);
        return;
      }
      
      // Format messages without join first
      const formattedMessages = simpleData?.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_username: msg.sender_username || 'Player',
        message: msg.message,
        created_at: msg.created_at
      })) || [];

      console.log(`✅ Fetched ${formattedMessages.length} messages`);
      setMessages(formattedMessages);
      setError(null);
      
      // Try to enrich with usernames in a separate query
      if (formattedMessages.length > 0) {
        const senderIds = [...new Set(formattedMessages.map(m => m.sender_id))];
        const { data: users } = await supabase
          .from('users')
          .select('id, username')
          .in('id', senderIds);
          
        if (users) {
          const userMap = Object.fromEntries(users.map(u => [u.id, u.username]));
          const enrichedMessages = formattedMessages.map(msg => ({
            ...msg,
            sender_username: userMap[msg.sender_id] || msg.sender_username
          }));
          setMessages(enrichedMessages);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a message - simplified without foreign key constraint
  const sendMessage = useCallback(async (message: string, userId: string) => {
    try {
      console.log('📤 Attempting to send message to database:', { message, userId });
      
      // For now, store messages without foreign key constraint
      const { data, error } = await supabase
        .from('user_messages')
        .insert({
          id: crypto.randomUUID(),
          sender_id: userId,
          message: message,
          recipient_id: null, // Public message
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(); // Return the inserted data

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      console.log('✅ Message sent successfully:', data);
      return data;
    } catch (err) {
      console.error('❌ Error sending message:', err);
      throw err;
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    console.log('🔄 Setting up realtime subscription...');
    fetchMessages();

    // Set up polling fallback - fetch messages every 3 seconds
    let pollInterval: NodeJS.Timeout | null = setInterval(() => {
      fetchMessages();
    }, 3000);

    // Subscribe to new messages - simplified approach
    const channel = supabase
      .channel('public-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages'
        },
        (payload) => {
          console.log('🔔 New message received from realtime:', payload);
          
          // Only process public messages (recipient_id is null)
          if (payload.new && payload.new.recipient_id === null) {
            const newMessage: ChatMessage = {
              id: payload.new.id,
              sender_id: payload.new.sender_id,
              sender_username: 'Unknown', // Will be filled by the query
              message: payload.new.message,
              created_at: payload.new.created_at
            };

            setMessages(prev => [...prev, newMessage]);
            
            // Refresh messages to get username
            fetchMessages();
            
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime messages');
          // Clear polling when realtime works
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - falling back to polling');
          setError(null); // Remove error since polling will handle updates
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Subscription timed out - using polling');
          setError(null);
        } else if (status === 'CLOSED') {
          console.error('🚪 Channel closed - using polling');
          setError(null);
        }
      });

    // Cleanup subscription and polling
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    refreshMessages: fetchMessages
  };
}