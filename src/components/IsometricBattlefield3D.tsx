import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Knight } from './characters/Knight';
import { Player, Faction, FactionType, GameState } from '@/types/game';

// Knight component wrapper for React Three Fiber
function KnightCharacter({ position, isMoving, targetPosition }: { position: [number, number, number], isMoving: boolean, targetPosition: [number, number, number] | null }) {
  const knightRef = useRef<Knight>();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    
    const knight = new Knight();
    knight.group.scale.set(0.5, 0.5, 0.5);
    groupRef.current.add(knight.group);
    knightRef.current = knight;
    
    if (isMoving) {
      knight.play();
    }

    return () => {
      if (groupRef.current && knight.group) {
        groupRef.current.remove(knight.group);
      }
    };
  }, []);

  useEffect(() => {
    if (knightRef.current) {
      if (isMoving) {
        knightRef.current.play();
      } else {
        knightRef.current.pause();
      }
    }
  }, [isMoving]);

  useFrame(() => {
    if (knightRef.current) {
      knightRef.current.update();
    }
    
    // Face the direction of movement
    if (groupRef.current && targetPosition && isMoving) {
      const [px, , pz] = position;
      const [tx, , tz] = targetPosition;
      const angle = Math.atan2(tx - px, tz - pz);
      groupRef.current.rotation.y = angle;
    }
  });

  return <group ref={groupRef} position={position} />;
}

// Ground plane that handles clicks
function Ground({ onClick }: { onClick: (point: THREE.Vector3) => void }) {
  const handleClick = (event: any) => {
    event.stopPropagation();
    onClick(event.point);
  };

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={handleClick} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#D2B48C" />
    </mesh>
  );
}

interface IsometricBattlefield3DProps {
  player: Player;
  factions: Record<FactionType, Faction>;
  gameState: GameState;
}

const IsometricBattlefield3D: React.FC<IsometricBattlefield3DProps> = ({ player, factions, gameState }) => {
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [targetPosition, setTargetPosition] = useState<[number, number, number] | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<'spawn' | 'territory'>('spawn');
  const [inventory, setInventory] = useState(player.inventory);
  const [spawnTimer, setSpawnTimer] = useState(60);

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

  const handleGroundClick = (point: THREE.Vector3) => {
    setTargetPosition([point.x, 0, point.z]);
    setIsMoving(true);
  };

  const enterTerritory = () => {
    if (spawnTimer > 0) {
      alert(`You must wait ${spawnTimer} seconds before entering the battlefield!`);
      return;
    }
    setCurrentRoom('territory');
    setPlayerPosition([0, 0, 0]);
  };

  return (
    <div className="relative w-full h-screen">
      {/* HUD */}
      <div className="absolute top-20 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg z-10">
        <h3 className="font-bold text-lg mb-2">{player.screenName}</h3>
        <p>Faction: Knights</p>
        <p>Health: {player.health}/100</p>
        <p>Arrows: {inventory.arrows}</p>
        <p>Bombs: {inventory.bombs}</p>
        {currentRoom === 'spawn' && (
          <p className="text-yellow-400 mt-2">Exit timer: {spawnTimer}s</p>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg z-10 max-w-md">
        <p>Click on the ground to move your knight!</p>
      </div>

      {/* 3D Scene */}
      <Canvas
        camera={{
          position: [10, 10, 10],
          fov: 50
        }}
        style={{ background: '#87CEEB' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Camera Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.5}
        />

        {/* Ground */}
        <Ground onClick={handleGroundClick} />

        {/* Grid Helper */}
        <gridHelper args={[100, 50, 0x888888, 0x444444]} />

        {/* Knight Character */}
        <KnightCharacter position={playerPosition} isMoving={isMoving} targetPosition={targetPosition} />

        {/* Simple spawn room walls if in spawn */}
        {currentRoom === 'spawn' && (
          <>
            <mesh position={[0, 2.5, -10]}>
              <boxGeometry args={[20, 5, 0.5]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[-10, 2.5, 0]}>
              <boxGeometry args={[0.5, 5, 20]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[10, 2.5, 0]}>
              <boxGeometry args={[0.5, 5, 20]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            
            {/* Exit door */}
            <mesh position={[8, 1.5, 0]} onClick={(e) => { e.stopPropagation(); enterTerritory(); }}>
              <boxGeometry args={[0.5, 3, 3]} />
              <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
            </mesh>
          </>
        )}

        {/* Click indicator */}
        {targetPosition && isMoving && (
          <mesh position={[targetPosition[0], 0.1, targetPosition[2]]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
          </mesh>
        )}
      </Canvas>
    </div>
  );
};

export default IsometricBattlefield3D;