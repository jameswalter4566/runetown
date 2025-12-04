import React, { useState } from 'react';
import { Copy } from 'lucide-react';

interface WalletDisplayProps {
  publicAddress: string;
  privateKey: string;
  onContinue: () => void;
}

export const WalletDisplay: React.FC<WalletDisplayProps> = ({ 
  publicAddress, 
  privateKey,
  onContinue 
}) => {
  const [copiedField, setCopiedField] = useState<'public' | 'private' | null>(null);

  const copyToClipboard = (text: string, field: 'public' | 'private') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Warning Message */}
      <div className="bg-yellow-100 border-4 border-yellow-400 rounded-lg p-4">
        <p className="text-lg font-bold text-yellow-800 text-center" style={{ fontFamily: "'Bowlby One', cursive" }}>
          🎉 YOUR PENGUIN TOKEN WALLET 🎉
        </p>
        <p className="text-sm text-yellow-700 text-center mt-2" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
          This is your wallet for earning in-game rewards and token supply!
        </p>
        <p className="text-sm text-green-700 text-center mt-2 font-bold animate-pulse" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
          🚀 Your penguin token is being launched on pump.fun! 🚀
        </p>
      </div>

      {/* Public Address */}
      <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
        <label className="block text-sm font-bold text-blue-800 mb-2" style={{ fontFamily: "'Bowlby One', cursive" }}>
          Public Address:
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(publicAddress, 'public')}
            className={`p-3 ${copiedField === 'public' ? 'bg-green-500' : 'bg-blue-500'} text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg`}
            title="Copy public address"
          >
            {copiedField === 'public' ? <span className="text-2xl font-bold">✓</span> : <Copy size={32} />}
          </button>
          <input
            type="text"
            value={publicAddress}
            readOnly
            className="flex-1 bg-white border-2 border-blue-300 rounded px-3 py-2 text-sm font-mono"
            style={{ fontFamily: "monospace", fontWeight: 400 }}
          />
        </div>
      </div>

      {/* Private Key */}
      <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
        <label className="block text-sm font-bold text-red-800 mb-2" style={{ fontFamily: "'Bowlby One', cursive" }}>
          Private Key (SAVE THIS!):
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(privateKey, 'private')}
            className={`p-3 ${copiedField === 'private' ? 'bg-green-500' : 'bg-red-500'} text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg`}
            title="Copy private key"
          >
            {copiedField === 'private' ? <span className="text-2xl font-bold">✓</span> : <Copy size={32} />}
          </button>
          <input
            type="text"
            value={privateKey}
            readOnly
            className="flex-1 bg-white border-2 border-red-300 rounded px-3 py-2 text-sm font-mono"
            style={{ fontFamily: "monospace", fontWeight: 400 }}
          />
        </div>
        <p className="text-xs text-red-600 mt-2 font-bold" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
          ⚠️ Never share your private key! Store it somewhere safe!
        </p>
        <p className="text-sm text-red-800 mt-2 font-bold text-center" style={{ fontFamily: "'Bowlby One', cursive" }}>
          THIS WILL SERVE AS YOUR PASSWORD
        </p>
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-bold"
        style={{ fontFamily: "'Bowlby One', cursive" }}
      >
        Play now!
      </button>
    </div>
  );
};