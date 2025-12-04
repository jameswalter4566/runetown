import { supabase } from '../lib/supabase';

export interface PlayerPosition {
  player_id: string;
  x: number;
  y: number;
  source_x?: number;
  source_y?: number;
  timestamp?: string;
  direction: string;
  model_type: string;
  screen_name: string;
}

export class PlayerPositionService {
  private static instance: PlayerPositionService;
  
  private constructor() {}
  
  static getInstance(): PlayerPositionService {
    if (!PlayerPositionService.instance) {
      PlayerPositionService.instance = new PlayerPositionService();
    }
    return PlayerPositionService.instance;
  }

  async insertPosition(position: Omit<PlayerPosition, 'timestamp'>): Promise<void> {
    const { error } = await supabase
      .from('player_positions')
      .insert({
        ...position,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('[PlayerPositionService] Error inserting position:', error);
      console.error('[PlayerPositionService] Position data:', position);
      throw error;
    }
    
    console.log('[PlayerPositionService] Position inserted:', {
      player: position.screen_name,
      from: `(${position.source_x?.toFixed(1)}, ${position.source_y?.toFixed(1)})`,
      to: `(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
      direction: position.direction
    });
  }

  async getLatestPositions(limit: number = 100): Promise<PlayerPosition[]> {
    // Get positions from the last 5 minutes to ensure we get active players
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const { data, error } = await supabase
      .from('player_positions')
      .select('*')
      .gte('timestamp', fiveMinutesAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[PlayerPositionService] Error fetching positions:', error);
      throw error;
    }

    return data || [];
  }

  subscribeToPositions(callback: (payload: any) => void, excludePlayerId?: string) {
    const channelName = 'player-positions';
    console.log('[PlayerPositionService] Creating subscription channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_positions'
        },
        (payload) => {
          // Skip if this is our own position update
          if (excludePlayerId && payload.new.player_id === excludePlayerId) {
            return;
          }
          
          console.log('[PlayerPositionService] New position received:', {
            player: payload.new.screen_name,
            x: payload.new.x,
            y: payload.new.y
          });
          callback(payload);
        }
      )
      .subscribe((status, error) => {
        console.log('[PlayerPositionService] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[PlayerPositionService] Successfully subscribed to player positions');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[PlayerPositionService] Failed to subscribe to player positions', error);
          // Retry subscription after a delay
          setTimeout(() => {
            console.log('[PlayerPositionService] Retrying subscription...');
            channel.subscribe();
          }, 2000);
        } else if (status === 'TIMED_OUT') {
          console.error('[PlayerPositionService] Subscription timed out');
        } else if (status === 'CLOSED') {
          console.error('[PlayerPositionService] Subscription closed');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}