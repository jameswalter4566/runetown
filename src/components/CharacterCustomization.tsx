import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FactionType } from '@/types/game';
import CharacterDisplay from './CharacterDisplay';

interface CharacterCustomizationProps {
  faction: FactionType;
  onCreateCharacter: (name: string, screenName: string) => void;
}

const CharacterCustomization: React.FC<CharacterCustomizationProps> = ({ faction, onCreateCharacter }) => {
  const [characterName, setCharacterName] = useState('');
  const [screenName, setScreenName] = useState('');

  const getFactionColor = () => {
    const colors: Record<FactionType, string> = {
      knights: '#C0C0C0',
      dragons: '#FF4500',
      wizards: '#4B0082',
      goblins: '#228B22',
      elves: '#20B2AA',
      custom: '#9932CC' // Purple color for Skeleton Archers
    };
    return colors[faction] || '#666666';
  };

  const getFactionName = () => {
    const names: Record<FactionType, string> = {
      knights: 'Knight',
      dragons: 'Dragon Lord',
      wizards: 'Wizard',
      goblins: 'Goblin',
      elves: 'Elf',
      custom: 'Skeleton Archer'
    };
    return names[faction] || 'Character';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (characterName.trim() && screenName.trim()) {
      onCreateCharacter(characterName.trim(), screenName.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Customize Your {getFactionName()}
        </h2>

        {/* Character Preview */}
        <div className="mb-8 flex justify-center">
          <CharacterDisplay character={faction} size={150} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="characterName" className="text-white">
              Character Name
            </Label>
            <Input
              id="characterName"
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder={`Enter your ${getFactionName()}'s name`}
              maxLength={30}
              required
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div>
            <Label htmlFor="screenName" className="text-white">
              Screen Name (Display Name)
            </Label>
            <Input
              id="screenName"
              type="text"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={20}
              required
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3 text-lg font-bold"
            style={{
              backgroundColor: getFactionColor(),
              color: 'white'
            }}
          >
            Enter Battle
          </Button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>
            You will spawn in your faction's preparation camp. 
            Gather weapons and prepare for battle!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CharacterCustomization;