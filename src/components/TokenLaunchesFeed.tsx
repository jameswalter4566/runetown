import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { ExternalLink } from 'lucide-react';
import '../styles/TokenLaunchesFeed.css';

interface TokenLaunch {
  id: string;
  username: string;
  token_name: string;
  token_symbol: string;
  token_address: string;
  image_url?: string;
  market_cap: number;
  lets_bonk_url: string;
  created_at: string;
}

export function TokenLaunchesFeed() {
  const [launches, setLaunches] = useState<TokenLaunch[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch initial launches and count
    fetchLaunches();
    fetchTotalCount();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('token_launches')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'token_launches'
      }, (payload) => {
        console.log('New token launch:', payload.new);
        // Add new launch at the beginning and maintain pagination
        setLaunches(prev => {
          const updated = [payload.new as TokenLaunch, ...prev];
          return updated.slice(0, itemsPerPage);
        });
        // Increment total count
        setTotalCount(prev => prev + 1);
        // Reset to first page to see new launch
        setCurrentPage(1);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchLaunches();
  }, [currentPage]);

  const fetchTotalCount = async () => {
    try {
      const { count, error } = await supabase
        .from('token_launches')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        setTotalCount(count);
      }
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  };

  const fetchLaunches = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      console.log('[TokenLaunchesFeed] Fetching launches from', from, 'to', to);
      
      const { data, error } = await supabase
        .from('token_launches')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('[TokenLaunchesFeed] Error fetching token launches:', error);
      } else {
        console.log('[TokenLaunchesFeed] Fetched launches:', data);
        setLaunches(data || []);
      }
    } catch (error) {
      console.error('[TokenLaunchesFeed] Error fetching token launches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const showPagination = totalCount > itemsPerPage;

  return (
    <div className="token-launches-feed">
      <div className="feed-header">
        <h3>Latest Token Launches</h3>
        <div className="feed-counter">{totalCount} Total</div>
      </div>
      <div className="feed-content">
        {isLoading ? (
          <div className="feed-loading">Loading...</div>
        ) : launches.length === 0 ? (
          <div className="feed-empty">No tokens launched yet</div>
        ) : (
          <div className="launches-list">
            {launches.map((launch) => (
              <div key={launch.id} className="launch-item">
                <div className="launch-left">
                  {launch.image_url && (
                    <img 
                      src={launch.image_url} 
                      alt={launch.token_name}
                      className="launch-image"
                    />
                  )}
                  <div className="launch-info">
                    <div className="launch-name">{launch.token_name}</div>
                    <div className="launch-details">
                      <span className="launch-symbol">${launch.token_symbol}</span>
                      <span className="launch-separator">•</span>
                      <span className="launch-address">{truncateAddress(launch.token_address)}</span>
                    </div>
                    <div className="launch-meta">
                      <span className="launch-user">by {launch.username}</span>
                      <span className="launch-separator">•</span>
                      <span className="launch-time">{formatTime(launch.created_at)}</span>
                    </div>
                  </div>
                </div>
                <a 
                  href={launch.lets_bonk_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="launch-link"
                  title="View on LetsBonk"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
      {showPagination && (
        <div className="feed-pagination">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ←
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}