import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Character3D from './Character3D';
import { Player, Faction, FactionType, GameState } from '@/types/game';

interface IsometricBattlefieldProps {
  player: Player;
  factions: Record<FactionType, Faction>;
  gameState: GameState;
}

const IsometricBattlefield: React.FC<IsometricBattlefieldProps> = ({ player, factions, gameState }) => {
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [isMoving, setIsMoving] = useState(false);
  const [targetPosition, setTargetPosition] = useState<[number, number, number] | null>(null);
  const [currentRoom, setCurrentRoom] = useState<'spawn' | 'territory' | 'battle'>('spawn');
  const [inventory, setInventory] = useState(player.inventory);
  const [spawnTimer, setSpawnTimer] = useState(60);

  const groundRef = useRef<THREE.Mesh>(null);

  // Spawn timer
  useEffect(() => {
    if (currentRoom === 'spawn' && spawnTimer > 0) {
      const timer = setTimeout(() => setSpawnTimer(spawnTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [spawnTimer, currentRoom]);

  // Movement logic
  useEffect(() => {
    if (!targetPosition) return;

    const moveInterval = setInterval(() => {
      setPlayerPosition(current => {
        const [cx, cy, cz] = current;
        const [tx, ty, tz] = targetPosition;
        
        const dx = tx - cx;
        const dz = tz - cz;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 0.1) {
          setIsMoving(false);
          setTargetPosition(null);
          return current;
        }
        
        const speed = 0.1;
        const moveX = (dx / distance) * speed;
        const moveZ = (dz / distance) * speed;
        
        return [cx + moveX, cy, cz + moveZ];
      });
    }, 16);

    return () => clearInterval(moveInterval);
  }, [targetPosition]);

  const handleGroundClick = (event: any) => {
    event.stopPropagation();
    const point = event.point;
    setTargetPosition([point.x, 0, point.z]);
    setIsMoving(true);
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
    setPlayerPosition([0, 0, 0]);
  };

  const renderSpawnRoom = () => {
    const faction = factions[player.faction];
    
    return (
      <>
        {/* Spawn room floor */}
        <mesh 
          ref={groundRef}
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.5, 0]}
          onClick={handleGroundClick}
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color={faction.color} opacity={0.3} transparent />
        </mesh>

        {/* Walls */}
        <mesh position={[0, 2, -10]}>
          <boxGeometry args={[20, 5, 0.5]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        <mesh position={[-10, 2, 0]}>
          <boxGeometry args={[0.5, 5, 20]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        <mesh position={[10, 2, 0]}>
          <boxGeometry args={[0.5, 5, 20]} />
          <meshStandardMaterial color="#444444" />
        </mesh>

        {/* Exit door */}
        <mesh position={[8, 1, 0]} onClick={enterTerritory}>
          <boxGeometry args={[0.5, 3, 3]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
        </mesh>
        
        {/* Weapon pickups */}
        <group position={[-5, 0.5, -5]} onClick={() => collectWeapon('arrows')}>
          <mesh>
            <coneGeometry args={[0.5, 1, 4]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[0.1, 0.1, 1]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
        </group>

        <group position={[5, 0.5, -5]} onClick={() => collectWeapon('bombs')}>
          <mesh>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3]} />
            <meshStandardMaterial color="#FF0000" />
          </mesh>
        </group>
      </>
    );
  };

  const renderTerritory = () => {
    return (
      <>
        {/* Territory floor */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.5, 0]}
          onClick={handleGroundClick}
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>

        {/* Manual grid lines */}
        <gridHelper args={[100, 50, '#666666', '#444444']} />

        {/* Faction territories */}
        {Object.entries(factions).map(([id, faction]) => {
          const territory = faction.territory;
          const scale = 0.1;
          
          return (
            <mesh
              key={id}
              position={[
                (territory.x + territory.width / 2) * scale - 30,
                0.1,
                (territory.y + territory.height / 2) * scale - 30
              ]}
            >
              <boxGeometry args={[
                territory.width * scale,
                0.2,
                territory.height * scale
              ]} />
              <meshStandardMaterial 
                color={faction.color} 
                opacity={0.6} 
                transparent 
              />
            </mesh>
          );
        })}
      </>
    );
  };

  return (
    <div className="relative w-full h-screen">
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

      {/* 3D Scene */}
      <Canvas 
        camera={{ 
          position: [15, 15, 15], 
          fov: 50
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.8}
        />
        
        {/* Environment lighting */}
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.5}
        />

        {/* Player character */}
        <Character3D
          faction={player.faction}
          position={playerPosition}
          isMoving={isMoving}
          direction={0}
        />

        {/* Room content */}
        {currentRoom === 'spawn' && renderSpawnRoom()}
        {currentRoom === 'territory' && renderTerritory()}
      </Canvas>
    </div>
  );
};

export default IsometricBattlefield;