// Simple wallet generation utility
// In production, use a proper crypto library like @solana/web3.js or ethers.js

export interface Wallet {
  publicKey: string;
  privateKey: string;
}

// Generate a mock wallet for development
// WARNING: This is NOT secure - use proper cryptographic libraries in production
export function generateWallet(): Wallet {
  const chars = '0123456789abcdef';
  
  // Generate mock keys (not cryptographically secure)
  const generateKey = (length: number): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  return {
    publicKey: generateKey(64),  // Mock public key
    privateKey: generateKey(64)  // Mock private key
  };
}

// Generate a mock token mint address
export function generateTokenMintAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}