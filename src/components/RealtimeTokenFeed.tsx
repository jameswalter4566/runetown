import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink } from 'lucide-react';

interface TokenLaunch {
  id: string;
  penguin_name: string;
  mint_address: string;
  penguin_color: string;
  created_at: string;
}

export const RealtimeTokenFeed: React.FC = () => {
  const [tokens, setTokens] = useState<TokenLaunch[]>([]);

  useEffect(() => {
    // Fetch initial tokens
    fetchLatestTokens();

    // Subscribe to new token launches
    const subscription = supabase
      .channel('token-launches')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          // Check if this is a new token launch (mint_address was null and is now set)
          if (payload.new && payload.new.mint_address && 
              payload.old && !payload.old.mint_address) {
            console.log('New token launched:', payload.new.penguin_name);
            // New token launched
            const newToken: TokenLaunch = {
              id: payload.new.id,
              penguin_name: payload.new.penguin_name,
              mint_address: payload.new.mint_address,
              penguin_color: payload.new.penguin_color,
              created_at: payload.new.created_at
            };
            setTokens(prev => [newToken, ...prev].slice(0, 10)); // Keep only latest 10
          }
        }
      )
      .subscribe((status) => {
        console.log('Token feed subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to token launches');
        }
      });

    return () => {
      console.log('Unsubscribing from token launches');
      subscription.unsubscribe();
    };
  }, []);

  const fetchLatestTokens = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, penguin_name, mint_address, penguin_color, created_at, last_token_update')
      .not('mint_address', 'is', null)
      .order('last_token_update', { ascending: false, nullsFirst: false })
      .limit(10);

    if (data && !error) {
      console.log('Fetched latest tokens:', data.length);
      setTokens(data);
    } else if (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const getTokenImage = (color: string) => {
    // Map color to preview image
    const colorMap: Record<string, string> = {
      '00BCD4': 'cyan',
      'FF0000': 'redd',
      '0000FF': 'blue',
      '008000': 'green',
      'FFFF00': 'yellow',
      'FFA500': 'orange',
      '800080': 'purple',
      'FFC0CB': 'salmon',
      '00FF00': 'lime',
      '000080': 'navy',
      '000000': 'black',
      '8B4513': 'brown',
      '228B22': 'forrest',
      'FF69B4': 'hotpink',
      'E6E6FA': 'lightpurplee'
    };
    
    const colorName = colorMap[color] || 'cyan';
    return `/penguin-previews/${colorName}.png`;
  };

  return (
    <div 
      className="fixed top-20 w-64 xl:w-80 max-h-[80vh] overflow-y-auto z-40 hidden xl:block"
      style={{ 
        fontFamily: "'Comic Sans MS', cursive",
        right: '1rem'
      }}
    >
      <div 
        className="bg-blue-100 rounded-t-2xl p-3 text-center font-bold text-blue-800 sticky top-0 z-10"
        style={{ 
          fontFamily: "'Bowlby One', cursive",
          border: '3px solid #4BA6FF',
          borderBottom: 'none'
        }}
      >
        Latest Token Launches
      </div>
      
      <div className="space-y-2 bg-white/90 backdrop-blur-sm rounded-b-2xl p-2" 
        style={{ border: '3px solid #4BA6FF', borderTop: 'none' }}
      >
        {tokens.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tokens launched yet!
          </div>
        ) : (
          tokens.map((token) => (
            <a
              key={token.id}
              href={`https://pump.fun/coin/${token.mint_address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl p-3 transition-all transform hover:scale-105 hover:shadow-lg border-2 border-blue-300"
            >
              <div className="flex items-center gap-3">
                {/* Token Image */}
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400 flex-shrink-0 bg-sky-200">
                  <img 
                    src={getTokenImage(token.penguin_color)}
                    alt={token.penguin_name}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-blue-800 flex items-center gap-1">
                    ${token.penguin_name}
                    <ExternalLink size={12} className="text-blue-600" />
                  </div>
                  <div className="text-xs text-gray-600 truncate font-mono">
                    {token.mint_address}
                  </div>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};
