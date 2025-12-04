interface TokenData {
  token: {
    name: string;
    symbol: string;
    mint: string;
    decimals: number;
    image: string;
  };
  pools: Array<{
    poolId: string;
    liquidity: {
      usd: number;
    };
    price: {
      usd: number;
    };
    marketCap: {
      usd: number;
    };
  }>;
  holders: number;
}

export async function fetchTokenData(tokenAddress: string): Promise<TokenData | null> {
  const apiKey = import.meta.env.VITE_SOLANA_TRACKER_KEY;
  
  if (!apiKey) {
    console.error('Solana Tracker API key not configured');
    return null;
  }

  try {
    const response = await fetch(`https://data.solanatracker.io/tokens/${tokenAddress}`, {
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
}

export function formatHolders(holders: number): string {
  if (holders >= 1000000) {
    return `${(holders / 1000000).toFixed(1)}M`;
  } else if (holders >= 1000) {
    return `${(holders / 1000).toFixed(1)}K`;
  }
  return holders.toString();
}