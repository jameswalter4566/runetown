import React, { useState, useRef, useEffect } from 'react';
import { Player, Faction, FactionType, GameState } from '@/types/game';

interface IsometricBattlefield2DProps {
  player: Player;
  factions: Record<FactionType, Faction>;
  gameState: GameState;
}

const IsometricBattlefield2D: React.FC<IsometricBattlefield2DProps> = ({ player, factions, gameState }) => {
  const [playerPosition, setPlayerPosition] = useState({ x: 400, y: 300 });
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentRoom, setCurrentRoom] = useState<'spawn' | 'territory' | 'battle'>('spawn');
  const [inventory, setInventory] = useState(player.inventory);
  const [spawnTimer, setSpawnTimer] = useState(60);
  const [isMoving, setIsMoving] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const mapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Spawn timer
  useEffect(() => {
    if (currentRoom === 'spawn' && spawnTimer > 0) {
      const timer = setTimeout(() => setSpawnTimer(spawnTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [spawnTimer, currentRoom]);

  // Movement animation
  useEffect(() => {
    const animate = () => {
      if (!targetPosition) {
        setIsMoving(false);
        return;
      }

      setPlayerPosition(current => {
        const dx = targetPosition.x - current.x;
        const dy = targetPosition.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
          setTargetPosition(null);
          setIsMoving(false);
          return current;
        }

        const speed = 4;
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;

        // Update direction
        setDirection(moveX > 0 ? 'right' : 'left');

        return {
          x: current.x + moveX,
          y: current.y + moveY
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    if (targetPosition) {
      setIsMoving(true);
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetPosition]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTargetPosition({ x, y });
  };

  const collectWeapon = (type: 'arrows' | 'bombs') => {
    if (currentRoom !== 'spawn') return;
    setInventory(prev => ({
      ...prev,
      [type]: prev[type] + (type === 'arrows' ? 20 : 5)
    }));
  };

  const enterTerritory = () => {
    if (spawnTimer > 0) {
      alert(`You must wait ${spawnTimer} seconds before entering the battlefield!`);
      return;
    }
    setCurrentRoom('territory');
    setPlayerPosition({ x: 400, y: 300 });
  };

  const getFactionText = (faction: FactionType) => {
    // Return text representation instead of emoji
    return faction.toUpperCase().charAt(0);
  };

  const renderSpawnRoom = () => {
    return (
      <div 
        ref={mapRef}
        className="relative w-full h-full cursor-pointer"
        onClick={handleMapClick}
        style={{ 
          backgroundColor: factions[player.faction].color + '20',
          backgroundImage: `linear-gradient(45deg, ${factions[player.faction].color}10 25%, transparent 25%, transparent 75%, ${factions[player.faction].color}10 75%, ${factions[player.faction].color}10),
                           linear-gradient(45deg, ${factions[player.faction].color}10 25%, transparent 25%, transparent 75%, ${factions[player.faction].color}10 75%, ${factions[player.faction].color}10)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}
      >
        {/* Exit door */}
        <div 
          className="absolute bg-yellow-500 hover:bg-yellow-600 cursor-pointer flex items-center justify-center rounded shadow-lg"
          style={{ right: 50, top: '45%', width: 60, height: 80 }}
          onClick={(e) => { e.stopPropagation(); enterTerritory(); }}
        >
          <span className="text-xl font-bold">EXIT</span>
        </div>

        {/* Weapon pickups */}
        <div 
          className="absolute cursor-pointer hover:scale-110 transition-transform"
          style={{ left: 200, top: 200 }}
          onClick={(e) => { e.stopPropagation(); collectWeapon('arrows'); }}
        >
          <div className="bg-amber-600 p-4 rounded-full shadow-lg">
            <span className="text-lg font-bold text-white">BOW</span>
          </div>
          <p className="text-center mt-2 font-bold">Arrows</p>
        </div>

        <div 
          className="absolute cursor-pointer hover:scale-110 transition-transform"
          style={{ right: 200, top: 200 }}
          onClick={(e) => { e.stopPropagation(); collectWeapon('bombs'); }}
        >
          <div className="bg-gray-700 p-4 rounded-full shadow-lg">
            <span className="text-lg font-bold text-white">TNT</span>
          </div>
          <p className="text-center mt-2 font-bold">Bombs</p>
        </div>
      </div>
    );
  };

  const renderTerritory = () => {
    return (
      <div 
        ref={mapRef}
        className="relative w-full h-full cursor-pointer bg-gray-800"
        onClick={handleMapClick}
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      >
        {/* Faction territories */}
        {Object.entries(factions).map(([id, faction]) => {
          const territory = faction.territory;
          const scale = 1.2;
          
          return (
            <div
              key={id}
              className="absolute border-2 flex items-center justify-center"
              style={{
                left: territory.x * scale,
                top: territory.y * scale,
                width: territory.width * scale,
                height: territory.height * scale,
                backgroundColor: faction.color + '40',
                borderColor: faction.color
              }}
            >
              <div className="text-center">
                <div className="text-5xl mb-2 font-bold bg-white text-black rounded-full w-16 h-16 flex items-center justify-center mx-auto">{getFactionText(id as FactionType)}</div>
                <div className="font-bold text-white">{faction.name}</div>
                <div className="text-sm text-gray-300">Treasury: {faction.treasury} SOL</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen bg-gray-900">
      {/* HUD */}
      <div className="absolute top-20 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg z-10">
        <h3 className="font-bold text-lg mb-2">{player.screenName}</h3>
        <p>Faction: {factions[player.faction].name}</p>
        <p>Health: {player.health}/100</p>
        <p>Arrows: {inventory.arrows}</p>
        <p>Bombs: {inventory.bombs}</p>
        {currentRoom === 'spawn' && (
          <p className="text-yellow-400 mt-2">
            Exit timer: {spawnTimer}s
          </p>
        )}
      </div>

      {/* Faction treasury info */}
      <div className="absolute top-20 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg z-10">
        <h3 className="font-bold text-lg mb-2">Faction Status</h3>
        <p>Treasury: {factions[player.faction].treasury} SOL</p>
        <p>Armory Reserve: {factions[player.faction].armoryReserve}</p>
        <p>Members: {factions[player.faction].members.length}</p>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg z-10 max-w-md">
        {currentRoom === 'spawn' && (
          <p>Collect weapons and exit through the golden door when timer reaches 0!</p>
        )}
        {currentRoom === 'territory' && (
          <p>Click to move. Defend your territory or attack enemy factions!</p>
        )}
      </div>

      {/* Game Map */}
      <div className="absolute inset-0 overflow-hidden">
        {currentRoom === 'spawn' && renderSpawnRoom()}
        {currentRoom === 'territory' && renderTerritory()}

        {/* Player Character */}
        <div
          className="absolute transition-none pointer-events-none"
          style={{
            left: playerPosition.x - 30,
            top: playerPosition.y - 30,
            transform: `scaleX(${direction === 'left' ? -1 : 1})`,
          }}
        >
          <div className={`text-3xl select-none ${isMoving ? 'animate-bounce' : ''} bg-white text-black rounded-full w-12 h-12 flex items-center justify-center font-bold border-2 border-black`}>
            {getFactionText(player.faction)}
          </div>
          <div className="text-center text-white text-sm font-bold mt-1">
            {player.screenName}
          </div>
        </div>

        {/* Click indicator */}
        {targetPosition && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: targetPosition.x - 15,
              top: targetPosition.y - 15
            }}
          >
            <div className="w-8 h-8 rounded-full border-4 border-white opacity-60 animate-ping" />
          </div>
        )}
      </div>
    </div>
  );
};

export default IsometricBattlefield2D;