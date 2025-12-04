import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  id: string;
  screen_name: string;
  wallet_address: string;
  time_held_seconds: number;
  supply_earned_percentage: number;
  transaction_hash: string;
  created_at: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('time_held_seconds', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
      } else {
        setLeaderboard(data || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLeaderboard();

    // Set up real-time subscription
    const channel = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'leaderboard' },
        () => {
          console.log('New score added, refreshing leaderboard...');
          fetchLeaderboard();
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leaderboard' },
        () => {
          console.log('Score updated, refreshing leaderboard...');
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'; // Gold
    if (rank === 2) return 'text-gray-300';   // Silver
    if (rank === 3) return 'text-orange-400'; // Bronze
    return 'text-white';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl comic-font">Loading Leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 comic-font bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🏆 LEADERBOARD 🏆
          </h1>
          <p className="text-xl text-blue-200 bubble-font">
            Top players who survived the longest in the Hold On game!
          </p>
          <div className="mt-4">
            <Button
              onClick={() => navigate('/')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg comic-font"
            >
              🎮 Play Game
            </Button>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-500/20 border border-green-400 rounded-lg px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm bubble-font">Live Updates Active</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
          {leaderboard.length === 0 ? (
            <div className="text-center text-white text-xl comic-font py-8">
              No scores yet! Be the first to play!
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-105
                    ${index < 3 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50' 
                      : 'bg-white/10 border border-white/20'
                    }
                  `}
                >
                  {/* Rank */}
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <span className="text-2xl">{getRankIcon(index + 1)}</span>
                    <span className={`text-2xl font-bold comic-font ${getRankColor(index + 1)}`}>
                      #{index + 1}
                    </span>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="text-white text-xl font-bold bubble-font mb-1">
                      {entry.screen_name}
                    </div>
                    <div className="text-gray-300 text-sm font-mono">
                      {entry.wallet_address.slice(0, 8)}...{entry.wallet_address.slice(-8)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-yellow-300 text-2xl font-bold comic-font">
                      {formatTime(entry.time_held_seconds)}
                    </div>
                    <div className="text-green-300 text-sm bubble-font">
                      {entry.supply_earned_percentage.toFixed(2)}% reward
                    </div>
                  </div>

                  {/* Solscan Link */}
                  <div>
                    <a
                      href={`https://solscan.io/tx/${entry.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors bubble-font"
                    >
                      📊 View TX
                    </a>
                  </div>

                  {/* Date */}
                  <div className="text-gray-400 text-xs min-w-[80px] text-right">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 bubble-font">
          <p>Updates automatically when new scores are submitted!</p>
        </div>
      </div>
    </div>
  );
}