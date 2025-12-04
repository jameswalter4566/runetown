import { supabase } from '@/integrations/supabase/client';

export interface PlayerChat {
  id?: string;
  player_id: string;
  message: string;
  x: number;
  y: number;
  screen_name: string;
  timestamp?: string;
}

export class PlayerChatService {
  private static instance: PlayerChatService;
  
  private constructor() {}
  
  static getInstance(): PlayerChatService {
    if (!PlayerChatService.instance) {
      PlayerChatService.instance = new PlayerChatService();
    }
    return PlayerChatService.instance;
  }

  async sendChat(chat: Omit<PlayerChat, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await supabase
      .from('player_chats')
      .insert({
        ...chat,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('[PlayerChatService] Error sending chat:', error);
      throw error;
    }
    
    console.log('[PlayerChatService] Chat sent:', {
      player: chat.screen_name,
      message: chat.message,
      position: { x: chat.x, y: chat.y }
    });
  }

  async getRecentChats(limit: number = 50): Promise<PlayerChat[]> {
    // Get chats from the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('player_chats')
      .select('*')
      .gte('timestamp', fiveMinutesAgo)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[PlayerChatService] Error fetching chats:', error);
      throw error;
    }

    return data || [];
  }

  subscribeToChatMessages(callback: (payload: any) => void) {
    const channelName = 'player-chats';
    console.log('[PlayerChatService] Creating subscription channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_chats'
        },
        (payload) => {
          console.log('[PlayerChatService] New chat received:', {
            player: payload.new.screen_name,
            message: payload.new.message,
            position: { x: payload.new.x, y: payload.new.y }
          });
          callback(payload);
        }
      )
      .subscribe((status, error) => {
        console.log('[PlayerChatService] Chat subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[PlayerChatService] Successfully subscribed to chat messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[PlayerChatService] Failed to subscribe to chat messages', error);
          // Retry subscription after a delay
          setTimeout(() => {
            console.log('[PlayerChatService] Retrying subscription...');
            channel.subscribe();
          }, 2000);
        } else if (status === 'TIMED_OUT') {
          console.error('[PlayerChatService] Subscription timed out');
        } else if (status === 'CLOSED') {
          console.error('[PlayerChatService] Subscription closed');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}