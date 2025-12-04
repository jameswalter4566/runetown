import React, { useState, useEffect } from 'react';
import { GameState, FactionType, Faction, Player } from '@/types/game';
import FactionSelection from './FactionSelection';
import CharacterCustomization from './CharacterCustomization';
import Battlefield3DMultiplayer from './Battlefield3DMultiplayer';
import MainMenu from './MainMenu';

const INITIAL_FACTIONS: Record<FactionType, Faction> = {
  knights: {
    id: 'knights',
    name: 'Knights of Valor',
    color: '#C0C0C0',
    treasury: 1000,
    armoryReserve: 500,
    members: [],
    territory: { x: -800, y: -800, width: 400, height: 400 },
    claimed: false
  },
  dragons: {
    id: 'dragons',
    name: 'Dragon Lords',
    color: '#FF4500',
    treasury: 1000,
    armoryReserve: 500,
    members: [],
    territory: { x: 400, y: -800, width: 400, height: 400 },
    claimed: false
  },
  wizards: {
    id: 'wizards',
    name: 'Wizard Council',
    color: '#4B0082',
    treasury: 1000,
    armoryReserve: 500,
    members: [],
    territory: { x: -200, y: -200, width: 400, height: 400 },
    claimed: false
  },
  goblins: {
    id: 'goblins',
    name: 'Goblin Horde',
    color: '#228B22',
    treasury: 1000,
    armoryReserve: 500,
    members: [],
    territory: { x: -800, y: 400, width: 400, height: 400 },
    claimed: false
  },
  elves: {
    id: 'elves',
    name: 'Elven Kingdom',
    color: '#20B2AA',
    treasury: 1000,
    armoryReserve: 500,
    members: [],
    territory: { x: 400, y: 400, width: 400, height: 400 },
    claimed: false
  },
  custom: {
    id: 'custom',
    name: 'Skeleton Archers',
    color: '#9932CC',  // Purple
    treasury: 1500,
    armoryReserve: 750,
    members: [],
    territory: { x: 0, y: 0, width: 400, height: 400 },
    claimed: false
  }
};

const ClashOfCoins: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MAIN_MENU);
  const [factions, setFactions] = useState<Record<FactionType, Faction>>(INITIAL_FACTIONS);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [selectedFaction, setSelectedFaction] = useState<FactionType | null>(null);

  const handleStartGame = () => {
    setGameState(GameState.FACTION_SELECT);
  };

  const handleFactionSelect = (faction: FactionType) => {
    const allClaimed = Object.values(factions).every(f => f.claimed);
    
    if (allClaimed) {
      // If all factions are claimed, assign randomly
      const availableFactions = Object.keys(factions) as FactionType[];
      const randomFaction = availableFactions[Math.floor(Math.random() * availableFactions.length)];
      setSelectedFaction(randomFaction);
    } else {
      setSelectedFaction(faction);
      // Mark faction as claimed if player is the first
      if (!factions[faction].claimed) {
        setFactions(prev => ({
          ...prev,
          [faction]: { ...prev[faction], claimed: true }
        }));
      }
    }
    
    setGameState(GameState.CHARACTER_CUSTOMIZE);
  };

  const handleCharacterCreate = (name: string, screenName: string) => {
    if (!selectedFaction) return;

    const newPlayer: Player = {
      id: `player_${Date.now()}`,
      name,
      screenName,
      faction: selectedFaction,
      position: { x: 0, y: 0, z: 0 },
      health: 100,
      inventory: { arrows: 100, bombs: 10 },
      wallet: `wallet_${Date.now()}`
    };

    // Add player to faction
    setFactions(prev => ({
      ...prev,
      [selectedFaction]: {
        ...prev[selectedFaction],
        members: [...prev[selectedFaction].members, newPlayer.id],
        treasury: prev[selectedFaction].treasury - 10 // Distribute SOL
      }
    }));

    setCurrentPlayer(newPlayer);
    setGameState(GameState.IN_GAME);
  };

  const renderGameState = () => {
    switch (gameState) {
      case GameState.MAIN_MENU:
        return <MainMenu onStart={handleStartGame} />;
      
      case GameState.FACTION_SELECT:
        return (
          <FactionSelection 
            factions={factions} 
            onSelectFaction={handleFactionSelect}
          />
        );
      
      case GameState.CHARACTER_CUSTOMIZE:
        return (
          <CharacterCustomization
            faction={selectedFaction!}
            onCreateCharacter={handleCharacterCreate}
          />
        );
      
      case GameState.IN_GAME:
      case GameState.BATTLE:
        return (
          <Battlefield3DMultiplayer
            player={currentPlayer!}
            factions={factions}
            gameState={gameState}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Game Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <h1 className="text-6xl font-bold text-yellow-400 tracking-wider"
            style={{
              textShadow: '3px 3px 6px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.5)',
              fontFamily: 'serif'
            }}>
          ⚔️ CLASH OF COINS ⚔️
        </h1>
      </div>

      {/* Game Content */}
      {renderGameState()}
    </div>
  );
};

export default ClashOfCoins;