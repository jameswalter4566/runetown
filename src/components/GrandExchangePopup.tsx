import React, { useState, useEffect } from 'react';
import { X, Search, TrendingUp, Clock, Heart, Copy } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
// import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import '../styles/GrandExchange.css';

interface TokenListing {
  id: string;
  token_address: string;
  name: string;
  symbol: string;
  price_usd: number;
  market_cap: number;
  price_change_24h: number;
  liquidity_usd: number;
  image_url?: string;
  likes: number;
  listed_by_username?: string;
  created_at: string;
}

interface GrandExchangePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'buy' | 'sell';
type SortMode = 'newest' | 'likes' | 'marketcap';

export const GrandExchangePopup: React.FC<GrandExchangePopupProps> = ({ isOpen, onClose }) => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('buy');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [tokenAddress, setTokenAddress] = useState('');
  const [searchedToken, setSearchedToken] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [listings, setListings] = useState<TokenListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [solAmounts, setSolAmounts] = useState<{ [key: string]: string }>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Truncate address helper
  const truncateAddress = (address: string, chars = 4) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  // Copy address to clipboard
  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success('Address copied!');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  // Fetch listings from database
  useEffect(() => {
    if (!isOpen) return;

    fetchListings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('exchange_coins_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'exchange_coins' },
        () => {
          fetchListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, sortMode]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('exchange_coins')
        .select('*');

      // Apply sorting
      switch (sortMode) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'likes':
          query = query.order('likes', { ascending: false });
          break;
        case 'marketcap':
          query = query.order('market_cap', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error('Error fetching listings:', error);
        return;
      }

      setListings(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlot(index);
  };

  const handleBuy = async (listing: TokenListing) => {
    const solAmount = parseFloat(solAmounts[listing.id] || '0');
    
    if (!solAmount || solAmount <= 0) {
      toast.error('Please enter a valid SOL amount');
      return;
    }

    try {
      // Check if Phantom is installed
      const provider = (window as any).solana;
      
      if (!provider?.isPhantom) {
        toast.error('Please install Phantom wallet');
        window.open('https://phantom.app/', '_blank');
        return;
      }

      // Connect to Phantom if not connected
      if (!provider.isConnected) {
        await provider.connect();
      }

      toast.info('Preparing swap transaction...');

      // SOL mint address
      const SOL_MINT = 'So11111111111111111111111111111111111111112';
      const LAMPORTS_PER_SOL = 1000000000;
      const amount = Math.floor(solAmount * LAMPORTS_PER_SOL);

      // Get swap transaction from Jupiter via edge function
      const { data: swapData, error: swapError } = await supabase.functions.invoke('create-swap-transaction', {
        body: {
          inputMint: SOL_MINT,
          outputMint: listing.token_address,
          amount: amount.toString(),
          userPublicKey: provider.publicKey.toString(),
          slippage: 100, // 1% slippage
          useLegacyTransaction: true // Use legacy transactions to avoid Phantom warnings
        }
      });

      if (swapError || !swapData?.success) {
        const errorMessage = swapError?.message || swapData?.error || 'Failed to create swap transaction';
        
        // Handle specific error cases with better messages
        if (errorMessage.toLowerCase().includes('insufficient balance')) {
          throw new Error('INSUFFICIENT_BALANCE');
        }
        
        throw new Error(errorMessage);
      }

      // Show preview of what user will receive
      if (swapData.quote) {
        const outputAmount = swapData.quote.outputAmount;
        // For simple display, assume 6 decimals for most tokens
        // In production, you'd fetch the actual decimals from token metadata
        const estimatedTokens = (parseInt(outputAmount) / 1000000).toFixed(2);
        toast.info(`You will receive approximately ${estimatedTokens} ${listing.symbol}`);
      }

      // The edge function returns a base64 encoded transaction
      const transactionBase64 = swapData.swapTransaction;
      
      // Decode the transaction for Phantom
      const transactionBuffer = Uint8Array.from(atob(transactionBase64), c => c.charCodeAt(0));
      
      // Import necessary classes from @solana/web3.js
      const { Transaction, VersionedTransaction } = await import('@solana/web3.js');
      
      // Check if we have the Phantom wallet object
      const phantomWallet = (window as any).solana;
      if (!phantomWallet || !phantomWallet.isPhantom) {
        throw new Error('Phantom wallet not found');
      }
      
      // Try to deserialize as VersionedTransaction first, fall back to legacy if needed
      let transaction: Transaction | VersionedTransaction;
      try {
        // First try as VersionedTransaction
        transaction = VersionedTransaction.deserialize(transactionBuffer);
        console.log('Deserialized as VersionedTransaction');
      } catch (e) {
        // Fall back to legacy Transaction
        console.log('Falling back to legacy Transaction deserialization');
        transaction = Transaction.from(transactionBuffer);
      }
      
      // Use Phantom's signAndSendTransaction method
      console.log('Using Phantom signAndSendTransaction...');
      const result = await phantomWallet.signAndSendTransaction(transaction);
      const signature = result.signature;

      // Show success immediately with transaction link
      // We can't check confirmation status without proper RPC access
      toast.success(
        <div>
          Swap initiated! 
          <a 
            href={`https://solscan.io/tx/${signature}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#ffcc00', marginLeft: '8px' }}
          >
            View TX
          </a>
        </div>
      );
      
      // Reset SOL amount
      setSolAmounts(prev => ({ ...prev, [listing.id]: '' }));
      
    } catch (error: any) {
      console.error('Swap error:', error);
      
      // Handle specific error types
      if (error.message === 'INSUFFICIENT_BALANCE') {
        toast.error('Insufficient SOL balance');
      } else if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled');
      } else if (error.message?.includes('insufficient')) {
        toast.error('Insufficient SOL balance');
      } else if (error.code === 4001) {
        toast.error('Transaction rejected by user');
      } else if (error.message?.includes('Failed to create swap')) {
        toast.error('Failed to create swap transaction');
      } else {
        toast.error(error.message || 'Swap failed');
      }
    }
  };

  // Quick buy amount setter
  const setQuickBuyAmount = (listingId: string, amount: string) => {
    setSolAmounts(prev => ({ ...prev, [listingId]: amount }));
  };

  const handleLike = async (listing: TokenListing, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .rpc('increment_coin_likes', { coin_id: listing.id });

      if (error) {
        console.error('Error liking token:', error);
        toast.error('Failed to like token');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to like token');
    }
  };

  const handleSearchToken = async () => {
    if (!tokenAddress.trim()) {
      toast.error('Please enter a token address');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-token', {
        body: { tokenAddress: tokenAddress.trim() }
      });

      if (error) {
        toast.error('Token not found');
        setSearchedToken(null);
        return;
      }

      if (data?.success && data.token) {
        setSearchedToken(data.token);
        toast.success('Token found!');
      } else {
        toast.error('Token not found');
        setSearchedToken(null);
      }
    } catch (error) {
      console.error('Error searching token:', error);
      toast.error('Failed to search token');
    } finally {
      setIsSearching(false);
    }
  };

  const handleListToken = async () => {
    if (!searchedToken) return;

    try {
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');

      const { error } = await supabase
        .from('exchange_coins')
        .insert({
          token_address: searchedToken.address,
          name: searchedToken.name,
          symbol: searchedToken.symbol,
          image_url: searchedToken.image,
          price_usd: searchedToken.price_usd,
          market_cap: searchedToken.market_cap,
          price_change_24h: searchedToken.price_change_24h,
          liquidity_usd: searchedToken.liquidity_usd,
          listed_by: userId,
          listed_by_username: username
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This token is already listed');
        } else {
          toast.error('Failed to list token');
        }
        return;
      }

      toast.success('Token listed successfully!');
      setSearchedToken(null);
      setTokenAddress('');
      setViewMode('buy');
    } catch (error) {
      console.error('Error listing token:', error);
      toast.error('Failed to list token');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="grand-exchange-overlay">
      <div className="grand-exchange-container">
        {/* Header */}
        <div className="ge-header">
          <div className="ge-header-left">
            <span className="ge-tab">History</span>
          </div>
          <div className="ge-title">Grand Exchange</div>
          <button className="ge-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Instructions and Controls */}
        <div className="ge-controls">
          <div className="ge-instructions">
            Select an offer slot to set up or view an offer
          </div>
          
          {/* Buy/Sell Toggle */}
          <div className="ge-mode-buttons">
            <button 
              className={`ge-mode-button ${viewMode === 'buy' ? 'active' : ''}`}
              onClick={() => setViewMode('buy')}
            >
              Buy a Token
            </button>
            <button 
              className={`ge-mode-button ${viewMode === 'sell' ? 'active' : ''}`}
              onClick={() => setViewMode('sell')}
            >
              List a Token
            </button>
          </div>

          {/* Sort Filter (only in buy mode) */}
          {viewMode === 'buy' && (
            <div className="ge-sort-filter">
              <span className="ge-filter-label">Sort by:</span>
              <select 
                value={sortMode} 
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="ge-filter-select"
              >
                <option value="newest">Newest</option>
                <option value="likes">Most Liked</option>
                <option value="marketcap">Market Cap</option>
              </select>
            </div>
          )}
        </div>

        {/* Content based on mode */}
        {viewMode === 'buy' ? (
          /* Buy Mode - Show token grid */
          <div className="ge-slots-container">
            {isLoading ? (
              <div className="ge-loading">Loading tokens...</div>
            ) : (
              <>
                {listings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className={`ge-slot ${selectedSlot === index ? 'selected' : ''} filled`}
                    onClick={() => handleSlotClick(index)}
                  >
                    <div className="ge-slot-header">
                      <span>Buy</span>
                      <button 
                        className="ge-like-button"
                        onClick={(e) => handleLike(listing, e)}
                        title={`${listing.likes} likes`}
                      >
                        <Heart size={14} fill={listing.likes > 0 ? '#ff9800' : 'none'} />
                        <span>{listing.likes}</span>
                      </button>
                    </div>
                    
                    <div className="ge-slot-content">
                      {listing.image_url && (
                        <div className="ge-token-icon">
                          <img src={listing.image_url} alt={listing.name} />
                        </div>
                      )}
                      <div className="ge-token-info">
                        <div className="ge-token-name">{listing.name}</div>
                        <div className="ge-token-symbol">${listing.symbol}</div>
                        <div className="ge-token-ca">
                          <span>{truncateAddress(listing.token_address)}</span>
                          <button 
                            className="ge-copy-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyAddress(listing.token_address);
                            }}
                            title="Copy address"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ge-slot-stats">
                      <div className="ge-stat">
                        <span className="ge-stat-label">Price:</span>
                        <span className="ge-stat-value">${listing.price_usd?.toFixed(6)}</span>
                      </div>
                      <div className="ge-stat">
                        <span className="ge-stat-label">MC:</span>
                        <span className="ge-stat-value">${(listing.market_cap / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="ge-stat">
                        <span className="ge-stat-label">24h:</span>
                        <span className={`ge-stat-value ${listing.price_change_24h >= 0 ? 'positive' : 'negative'}`}>
                          {listing.price_change_24h?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* SOL Amount Input */}
                    <div className="ge-amount-section">
                      <input
                        type="number"
                        placeholder="SOL Amount"
                        value={solAmounts[listing.id] || ''}
                        onChange={(e) => setSolAmounts(prev => ({ ...prev, [listing.id]: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="ge-sol-input"
                        step="0.1"
                        min="0"
                      />
                      <div className="ge-quick-amounts">
                        {['0.5', '1', '2', '3'].map(amount => (
                          <button
                            key={amount}
                            className="ge-quick-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickBuyAmount(listing.id, amount);
                            }}
                          >
                            {amount}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <button 
                      className="ge-buy-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuy(listing);
                      }}
                    >
                      Buy
                    </button>
                  </div>
                ))}
                
                {/* Fill empty slots */}
                {Array.from({ length: Math.max(0, 20 - listings.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="ge-slot empty">
                    <div className="ge-slot-header">Empty</div>
                    <div className="ge-empty-slot">
                      <div className="ge-empty-icon">+</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          /* Sell Mode - Token search and listing */
          <div className="ge-sell-container">
            <div className="ge-search-section">
              <h3>Search for a token to list</h3>
              <div className="ge-search-input-group">
                <input
                  type="text"
                  placeholder="Enter token contract address"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="ge-search-input"
                />
                <button 
                  className="ge-search-button"
                  onClick={handleSearchToken}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    'Searching...'
                  ) : (
                    <>
                      <Search size={16} />
                      Search Token
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Display searched token */}
            {searchedToken && (
              <div className="ge-searched-token">
                <h4>Token Found:</h4>
                <div className="ge-token-display">
                  {searchedToken.image && (
                    <img src={searchedToken.image} alt={searchedToken.name} className="ge-token-display-image" />
                  )}
                  <div className="ge-token-display-info">
                    <div className="ge-token-name">{searchedToken.name}</div>
                    <div className="ge-token-symbol">${searchedToken.symbol}</div>
                    <div className="ge-token-stats-row">
                      <span>Price: ${searchedToken.price_usd?.toFixed(6)}</span>
                      <span>MC: ${(searchedToken.market_cap / 1000).toFixed(1)}K</span>
                      <span>Liquidity: ${(searchedToken.liquidity_usd / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                  <button 
                    className="ge-list-button"
                    onClick={handleListToken}
                  >
                    List this Coin
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};