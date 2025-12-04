import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FactionType, Faction } from '@/types/game';

interface FactionSelectionProps {
  factions: Record<FactionType, Faction>;
  onSelectFaction: (faction: FactionType) => void;
}

const FactionSelection: React.FC<FactionSelectionProps> = ({ factions, onSelectFaction }) => {
  const [selectedFaction, setSelectedFaction] = useState<FactionType | null>(null);

  const allClaimed = Object.values(factions).every(f => f.claimed);

  const handleFactionClick = (factionId: FactionType) => {
    if (!allClaimed && factions[factionId].claimed) return;
    setSelectedFaction(factionId);
  };

  const getFactionInitial = (faction: FactionType) => {
    // Return first letter of faction instead of emoji
    return faction.toUpperCase().charAt(0);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Choose Your Faction</h2>
        
        {/* Faction Grid - Standard HTML containers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(factions).map(([id, faction]) => {
            const isSelected = selectedFaction === id;
            const isDisabled = !allClaimed && faction.claimed;
            
            return (
              <div
                key={id}
                onClick={() => handleFactionClick(id as FactionType)}
                className={`
                  relative p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer
                  ${isSelected ? 'border-yellow-400 shadow-xl' : 'border-gray-600'}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 hover:shadow-lg'}
                `}
                style={{
                  backgroundColor: faction.color + '20',
                  borderColor: isSelected ? '#FFD700' : faction.color
                }}
              >
                {/* Faction Initial */}
                <div 
                  className="text-6xl font-bold text-center mb-4"
                  style={{ color: faction.color }}
                >
                  {getFactionInitial(id as FactionType)}
                </div>
                
                {/* Faction Name */}
                <h3 className="text-2xl font-bold text-white text-center mb-4">
                  {faction.name}
                </h3>
                
                {/* Faction Stats */}
                <div className="grid grid-cols-2 gap-4 text-gray-300 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">Treasury</p>
                    <p className="text-lg">{faction.treasury} SOL</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Members</p>
                    <p className="text-lg">{faction.members.length}</p>
                  </div>
                </div>
                
                {/* Territory Info */}
                <div className="mt-4 text-center text-gray-400 text-sm">
                  <p>Territory: {faction.territory.width}x{faction.territory.height}</p>
                </div>
                
                {/* Claimed Badge */}
                {faction.claimed && !allClaimed && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                    CLAIMED
                  </div>
                )}
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      boxShadow: `0 0 20px ${faction.color}`,
                      border: `3px solid ${faction.color}`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Join Button and Info */}
        {selectedFaction && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Join {factions[selectedFaction].name}
            </h3>
            
            <p className="text-gray-300 mb-6">
              {!allClaimed && !factions[selectedFaction].claimed 
                ? 'You will become the leader of this faction!' 
                : 'Join this faction and receive SOL from the treasury!'}
            </p>
            
            <Button
              onClick={() => onSelectFaction(selectedFaction)}
              className="px-8 py-3 text-lg font-bold"
              style={{
                backgroundColor: factions[selectedFaction].color,
                color: 'white'
              }}
            >
              {!allClaimed && !factions[selectedFaction].claimed 
                ? 'Claim Leadership' 
                : 'Join Faction'}
            </Button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 max-w-3xl mx-auto text-center text-gray-400 text-sm">
          <p>
            When a new player joins a faction, SOL will be automatically distributed from the kingdom treasury 
            to that player's in-game wallet. Create more players to increase the value of your faction's 
            territory and continue to increase your faction's armory reserve to fight against other factions!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FactionSelection;