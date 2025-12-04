import React, { useEffect, useState } from 'react';
import { X, Copy, TrendingUp, Rocket } from 'lucide-react';
import { formatMarketCap } from '@/utils/tokenUtils';
import { supabase } from '@/integrations/supabase/client';
import { PENGUIN_COLORS } from '@/lib/penguinColors';
import { fetchTokenData, formatHolders } from '@/services/solanaTracker';

interface TokenProfilePopupProps {
  username: string;
  modelFile: string;
  coins: number;
  stamps: string[];
  mintAddress?: string;
  marketCap?: number;
  holders?: number | null;
  onClose: () => void;
}

const TokenProfilePopup: React.FC<TokenProfilePopupProps> = ({
  username,
  modelFile,
  coins,
  stamps,
  mintAddress,
  marketCap = 4200,
  holders: holdersFromProps,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [priceChange] = useState(() => (Math.random() * 40 - 20).toFixed(2)); // Random price change for demo
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const [realMarketCap, setRealMarketCap] = useState<number | null>(null);
  const [holders, setHolders] = useState<number | null>(holdersFromProps || null);

  const copyMintAddress = () => {
    if (mintAddress) {
      navigator.clipboard.writeText(mintAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch real token data when mint address is available
  useEffect(() => {
    if (mintAddress && !holdersFromProps) {
      fetchTokenData(mintAddress).then(data => {
        if (data && data.pools && data.pools.length > 0) {
          setRealMarketCap(data.pools[0].marketCap.usd);
          setHolders(data.holders);
        }
      });
    } else if (holdersFromProps) {
      setHolders(holdersFromProps);
    }
  }, [mintAddress, holdersFromProps]);

  const launchToken = async () => {
    try {
      setIsLaunching(true);
      setLaunchError(null);
      
      // Get current user ID
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not logged in');
      }

      // Get penguin color from model file
      const colorMatch = modelFile.match(/wAddle(.+)\.glb/);
      if (!colorMatch) {
        throw new Error('Invalid model file');
      }
      
      // Find the color hex from the model name
      const colorName = colorMatch[1];
      const penguinColorData = PENGUIN_COLORS.find(c => 
        c.modelFile === modelFile
      );
      
      if (!penguinColorData) {
        throw new Error('Could not find penguin color');
      }

      // Get the penguin preview image and convert to base64
      const imageUrl = penguinColorData.previewImage;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data:image/png;base64, prefix
          resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const imageBase64 = await base64Promise;

      // Call the edge function to create token
      const { data, error } = await supabase.functions.invoke('create-penguin-token', {
        body: {
          userId,
          penguinName: username,
          penguinColor: penguinColorData.hex,
          imageBase64
        }
      });

      if (error) throw error;
      
      if (data.success) {
        setLaunchSuccess(true);
        // Reload the page after 3 seconds to show the new token
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Token launch error:', error);
      setLaunchError(error.message || 'Failed to launch token');
    } finally {
      setIsLaunching(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="relative w-full max-w-2xl rounded-3xl p-6 shadow-2xl"
        style={{ 
          backgroundColor: '#E8F4F8',
          border: '8px solid #4BA6FF',
          fontFamily: "'Comic Sans MS', cursive"
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header with penguin info */}
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-400 flex items-center justify-center"
            style={{ backgroundColor: '#87CEEB' }}
          >
            <img 
              src={`/penguin-previews/${modelFile.replace('wAddle', '').replace('.glb', '').toLowerCase()}.png`}
              alt={username}
              className="w-28 h-28 object-contain"
              style={{ marginTop: '8px' }}
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Bowlby One', cursive" }}>
              {username}
            </h2>
            <p className="text-gray-600">
              <span className="font-bold">Coins:</span> {coins}
            </p>
            <p className="text-gray-600">
              <span className="font-bold">Stamps:</span> {stamps.length}
            </p>
          </div>
        </div>

        {/* Token Info Section */}
        <div className="bg-white rounded-lg p-4 mb-4 border-2 border-blue-300">
          <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Bowlby One', cursive" }}>
            ${username} Token
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Market Cap</p>
              <p className="text-lg font-bold">{formatMarketCap(realMarketCap || marketCap)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">24h Change</p>
              <p className={`text-lg font-bold flex items-center gap-1 ${parseFloat(priceChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp size={16} className={parseFloat(priceChange) < 0 ? 'rotate-180' : ''} />
                {priceChange}%
              </p>
            </div>
          </div>

          {mintAddress ? (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Mint Address</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 p-2 rounded text-xs overflow-hidden text-ellipsis">
                  {mintAddress}
                </code>
                <button
                  onClick={copyMintAddress}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                  style={{ fontFamily: "'Bowlby One', cursive" }}
                >
                  {copied ? '✓' : <Copy size={16} />}
                </button>
              </div>
              <div className="mt-2">
                <a
                  href={`https://pump.fun/coin/${mintAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-bold"
                  style={{ fontFamily: "'Bowlby One', cursive" }}
                >
                  <span>VIEW ON LETS BONK</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {!isLaunching && !launchSuccess && !launchError && (
                <button
                  onClick={launchToken}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 font-bold flex items-center gap-2 mx-auto"
                  style={{ fontFamily: "'Bowlby One', cursive" }}
                >
                  <Rocket size={20} />
                  Launch ${username} Token!
                </button>
              )}
              
              {isLaunching && (
                <div className="text-blue-600 font-semibold">
                  <p className="animate-pulse">🚀 Launching your token on pump.fun...</p>
                </div>
              )}
              
              {launchSuccess && (
                <div className="text-green-600 font-semibold">
                  <p>✅ Token launched successfully!</p>
                  <p className="text-sm">Refreshing page...</p>
                </div>
              )}
              
              {launchError && (
                <div className="text-red-600 font-semibold">
                  <p>❌ {launchError}</p>
                  <button
                    onClick={() => setLaunchError(null)}
                    className="text-sm underline mt-2"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DexScreener Chart */}
        <div className="bg-white rounded-lg p-2 border-2 border-blue-300">
          <div className="mb-2 text-xs text-gray-500 text-center">
            {mintAddress ? `Chart: ${username} Token` : 'Chart: SOL/USD (Launch token to see your chart)'}
          </div>
          {mintAddress ? (
            <iframe
              src={`https://dexscreener.com/solana/${mintAddress}?embed=1&theme=light&trades=0&info=0`}
              className="w-full rounded"
              style={{ height: '400px', border: 'none' }}
              title={`${username} Token Chart`}
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              <p>Launch your token to see the chart!</p>
            </div>
          )}
        </div>

        {/* Token Stats */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Ticker: ${username.toUpperCase()} | Supply: 1,000,000,000</p>
        </div>
      </div>
    </div>
  );
};

export default TokenProfilePopup;
