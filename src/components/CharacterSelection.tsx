import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CharacterType, CoinData } from '@/types/game';
import CharacterDisplay from './CharacterDisplay';

interface CharacterSelectionProps {
  onCharacterSelected: (character: CharacterType) => void;
  onCoinCreated: (coinData: CoinData) => void;
}

const CharacterSelection: React.FC<CharacterSelectionProps> = ({ 
  onCharacterSelected, 
  onCoinCreated 
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null);
  const [coinData, setCoinData] = useState<CoinData>({
    name: '',
    symbol: '',
    description: '',
    twitterUrl: '',
    telegramUrl: '',
    websiteUrl: ''
  });

  const characters: { type: CharacterType; name: string; color: string }[] = [
    { type: 'knight', name: 'Knight', color: '#C0C0C0' },
    { type: 'king', name: 'King', color: '#FFD700' },
    { type: 'queen', name: 'Queen', color: '#8B008B' },
    { type: 'goblin', name: 'Goblin', color: '#228B22' }
  ];

  const handleCoinDataChange = (field: keyof CoinData, value: string) => {
    setCoinData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoinData(prev => ({ ...prev, tokenImage: file }));
    }
  };

  const handleSubmit = () => {
    if (selectedCharacter && coinData.name && coinData.symbol && coinData.description) {
      onCoinCreated(coinData);
      onCharacterSelected(selectedCharacter);
    }
  };

  return (
    <div className="min-h-screen bg-tan-100 p-8" style={{ backgroundColor: '#D2B48C' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-brown-800">Character Selection</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Character Display */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col">
            <h2 className="text-2xl font-semibold mb-4">Choose Your Character</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {characters.map((char) => (
                <Button
                  key={char.type}
                  onClick={() => setSelectedCharacter(char.type)}
                  variant={selectedCharacter === char.type ? 'default' : 'outline'}
                  className="h-20 text-lg font-semibold"
                  style={{
                    backgroundColor: selectedCharacter === char.type ? char.color : 'transparent',
                    color: selectedCharacter === char.type ? 'white' : char.color,
                    borderColor: char.color
                  }}
                >
                  {char.name}
                </Button>
              ))}
            </div>

            {/* Large character display */}
            <div className="flex-1 flex items-center justify-center">
              {selectedCharacter ? (
                <CharacterDisplay character={selectedCharacter} size={300} />
              ) : (
                <div className="text-gray-400 text-center">
                  <p className="text-xl">Select a character to see preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Coin Creation Form */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Create Your Coin</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="coinName">Coin Name * <span className="text-sm text-gray-500">(max 30 characters)</span></Label>
                <Input
                  id="coinName"
                  value={coinData.name}
                  onChange={(e) => handleCoinDataChange('name', e.target.value)}
                  placeholder="e.g., Trump Rocket"
                  maxLength={30}
                  required
                />
              </div>

              <div>
                <Label htmlFor="symbol">Symbol * <span className="text-sm text-gray-500">(max 9 characters)</span></Label>
                <Input
                  id="symbol"
                  value={coinData.symbol}
                  onChange={(e) => handleCoinDataChange('symbol', e.target.value.toUpperCase())}
                  placeholder="e.g., TRMP"
                  maxLength={9}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={coinData.description}
                  onChange={(e) => handleCoinDataChange('description', e.target.value)}
                  placeholder="Describe your coin and its purpose..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tokenImage">Token Image (optional)</Label>
                <Input
                  id="tokenImage"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, or WebP. Max 5MB.</p>
              </div>

              <div>
                <Label htmlFor="twitter">Twitter URL (optional)</Label>
                <Input
                  id="twitter"
                  type="url"
                  value={coinData.twitterUrl}
                  onChange={(e) => handleCoinDataChange('twitterUrl', e.target.value)}
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <Label htmlFor="telegram">Telegram URL (optional)</Label>
                <Input
                  id="telegram"
                  type="url"
                  value={coinData.telegramUrl}
                  onChange={(e) => handleCoinDataChange('telegramUrl', e.target.value)}
                  placeholder="https://t.me/..."
                />
              </div>

              <div>
                <Label htmlFor="website">Website URL (optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={coinData.websiteUrl}
                  onChange={(e) => handleCoinDataChange('websiteUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedCharacter || !coinData.name || !coinData.symbol || !coinData.description}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection;