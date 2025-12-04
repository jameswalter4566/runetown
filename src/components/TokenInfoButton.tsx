import React, { useState, useEffect } from 'react';
import { ExternalLink, Coins } from 'lucide-react';

interface TokenInfoButtonProps {
  className?: string;
}

const TokenInfoButton: React.FC<TokenInfoButtonProps> = ({ className }) => {
  const [tokenInfo, setTokenInfo] = useState<{
    mintAddress?: string;
    marketCap?: number;
    letsBonkUrl?: string;
    username?: string;
  } | null>(null);

  useEffect(() => {
    // Load token info from localStorage
    const characterDataStr = localStorage.getItem('characterData');
    if (characterDataStr) {
      try {
        const characterData = JSON.parse(characterDataStr);
        if (characterData.mintAddress || characterData.letsBonkUrl) {
          setTokenInfo({
            mintAddress: characterData.mintAddress,
            marketCap: characterData.marketCap || 4200,
            letsBonkUrl: characterData.letsBonkUrl || (characterData.mintAddress ? `https://pump.fun/coin/${characterData.mintAddress}` : undefined),
            username: characterData.username
          });
        }
      } catch (error) {
        console.error('Error parsing character data:', error);
      }
    }
  }, []);

  if (!tokenInfo || !tokenInfo.letsBonkUrl) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #ff9800',
        borderRadius: '8px',
        padding: '8px 12px',
        fontFamily: 'RuneScape, Arial, sans-serif',
        fontSize: '14px',
        color: '#ff9800',
        textShadow: '1px 1px 1px #000',
      }}
    >
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Coins size={16} />
        <span>${tokenInfo.username || 'Token'}</span>
        <span style={{ color: '#ffcc00' }}>• MC: ${(tokenInfo.marketCap || 4200).toLocaleString()}</span>
      </div>
      <a
        href={tokenInfo.letsBonkUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#ffcc00',
          textDecoration: 'none',
          padding: '6px 10px',
          backgroundColor: 'rgba(255, 152, 0, 0.2)',
          borderRadius: '4px',
          border: '1px solid #ff9800',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.3)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.2)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span>View on LetsBonk</span>
        <ExternalLink size={14} />
      </a>
    </div>
  );
};

export default TokenInfoButton;
