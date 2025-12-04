import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Knight } from './characters/Knight';
import { Goblin } from './characters/Goblin';
import { Dragon } from './characters/Dragon';
import { Wizard } from './characters/Wizard';
import { Elf } from './characters/Elf';
import { SkeletonArcher } from './characters/SkeletonArcher';
import { Player, Faction, FactionType, GameState } from '@/types/game';
import Castle3D from './Castle3D';
import CastleWalls3D from './CastleWalls3D';
import Mountain3D from './Mountain3D';
import Arrow3D from './Arrow3D';

// Character wrapper that handles all faction types
function CharacterModel({ faction, position, rotation, isMoving }: { 
  faction: FactionType, 
  position: [number, number, number], 
  rotation: number,
  isMoving: boolean 
}) {
  const characterRef = useRef<Knight | Goblin | Dragon | Wizard | Elf | SkeletonArcher>();
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3(...position));
  const currentPosition = useRef(new THREE.Vector3(...position));
  const targetRotation = useRef(rotation);
  const currentRotation = useRef(rotation);

  useEffect(() => {
    if (!groupRef.current) return;
    
    // Debug log to verify faction
    console.log('Creating character for faction:', faction);
    
    let character: Knight | Goblin | Dragon | Wizard | Elf | SkeletonArcher;
    
    switch (faction) {
      case 'knights':
        character = new Knight();
        break;
      case 'goblins':
        character = new Goblin();
        break;
      case 'dragons':
        character = new Dragon();
        break;
      case 'wizards':
        character = new Wizard();
        break;
      case 'elves':
        character = new Elf();
        break;
      case 'custom':
        // Create a SkeletonArcher character
        character = new SkeletonArcher();
        break;
      default:
        character = new Knight();
    }
    
    // Set appropriate scale for all characters
    character.group.scale.set(0.5, 0.5, 0.5);
    character.group.position.set(0, -8, 26);
    
    if (character instanceof SkeletonArcher) {
      console.log('SkeletonArcher detected, applying standard battlefield scale');
    }
    groupRef.current.add(character.group);
    characterRef.current = character;
    
    if (isMoving) {
      character.play();
    }

    return () => {
      if (groupRef.current && character.group) {
        groupRef.current.remove(character.group);
      }
    };
  }, [faction]);

  useEffect(() => {
    if (characterRef.current) {
      if (isMoving) {
        characterRef.current.play();
      } else {
        characterRef.current.pause();
      }
    }
  }, [isMoving]);

  // Update target position and rotation
  useEffect(() => {
    targetPosition.current.set(...position);
  }, [position]);

  useEffect(() => {
    targetRotation.current = rotation;
  }, [rotation]);

  useFrame(() => {
    if (characterRef.current) {
      characterRef.current.update();
    }
    
    if (groupRef.current) {
      // Smooth position interpolation
      currentPosition.current.lerp(targetPosition.current, 0.3);
      groupRef.current.position.copy(currentPosition.current);
      
      // Smooth rotation interpolation
      const rotDiff = targetRotation.current - currentRotation.current;
      // Handle rotation wrap-around
      if (rotDiff > Math.PI) currentRotation.current += Math.PI * 2;
      if (rotDiff < -Math.PI) currentRotation.current -= Math.PI * 2;
      currentRotation.current += (targetRotation.current - currentRotation.current) * 0.3;
      groupRef.current.rotation.y = currentRotation.current;
    }
  });

  return (
    <group ref={groupRef} />
  );
}

// Over-the-shoulder (OTS) camera controller
function ThirdPersonCamera({ target, rotation, verticalLook }: { target: THREE.Vector3, rotation: number, verticalLook: number }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Over-the-shoulder camera settings
    const distance = 3; // Much closer
    const height = 2; // Lower height for shoulder view
    const sideOffset = 0.8; // Offset to the right for OTS view
    
    // Calculate camera position BEHIND and to the SIDE of character
    const forwardX = -Math.sin(rotation);
    const forwardZ = -Math.cos(rotation);
    
    // Right vector (perpendicular to forward)
    const rightX = -Math.cos(rotation);
    const rightZ = Math.sin(rotation);
    
    // Camera position: behind + to the right + up
    const cameraX = target.x + (forwardX * distance) + (rightX * sideOffset);
    const cameraZ = target.z + (forwardZ * distance) + (rightZ * sideOffset);
    
    // Smooth camera follow
    camera.position.lerp(
      new THREE.Vector3(
        cameraX,
        target.y + height,
        cameraZ
      ),
      0.1
    );
    
    // Look ahead of the character at crosshair aim point with vertical adjustment
    const aimDistance = 50; // How far the aim point is
    const horizontalDistance = aimDistance * Math.cos(verticalLook);
    const verticalOffset = aimDistance * Math.sin(verticalLook);
    
    const lookTarget = new THREE.Vector3(
      target.x + Math.sin(rotation) * horizontalDistance,
      target.y + 1.5 + verticalOffset, // Apply vertical aim
      target.z + Math.cos(rotation) * horizontalDistance
    );
    camera.lookAt(lookTarget);
  });
  
  return null;
}

// Ground plane
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#D2B48C" />
    </mesh>
  );
}

interface Battlefield3DProps {
  player: Player;
  factions: Record<FactionType, Faction>;
  gameState: GameState;
}

const Battlefield3D: React.FC<Battlefield3DProps> = ({ player, factions, gameState }) => {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(-5, 0.5, 0)); // Centered in spawn room
  const [playerRotation, setPlayerRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<'spawn' | 'territory'>('spawn');
  const [inventory, setInventory] = useState(player.inventory);
  const [spawnTimer, setSpawnTimer] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [arrows, setArrows] = useState<Array<{ id: string; position: THREE.Vector3; direction: THREE.Vector3 }>>([]);
  const [verticalLook, setVerticalLook] = useState(0); // For up/down aim
  
  // Input states
  const keysPressed = useRef<Set<string>>(new Set());
  const mouseMovement = useRef({ x: 0, y: 0 });
  const isPointerLocked = useRef(false);
  const lastShootTime = useRef(0);

  // Spawn timer - disabled
  // useEffect(() => {
  //   if (currentRoom === 'spawn' && spawnTimer > 0) {
  //     const timer = setTimeout(() => setSpawnTimer(spawnTimer - 1), 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [spawnTimer, currentRoom]);

  // Shoot arrow function
  const shootArrow = useCallback(() => {
    const now = Date.now();
    const shootCooldown = 200; // 200ms between shots
    
    if (inventory.arrows <= 0 || now - lastShootTime.current < shootCooldown) return;
    
    lastShootTime.current = now;
    
    // Calculate arrow spawn position (slightly in front of character)
    const spawnDistance = 1;
    const spawnHeight = 1.5;
    const arrowPosition = new THREE.Vector3(
      playerPosition.x + Math.sin(playerRotation) * spawnDistance,
      playerPosition.y + spawnHeight,
      playerPosition.z + Math.cos(playerRotation) * spawnDistance
    );
    
    // Arrow direction matches camera look direction with vertical aim
    const horizontalDir = new THREE.Vector3(
      Math.sin(playerRotation),
      0,
      Math.cos(playerRotation)
    );
    
    // Apply vertical rotation based on mouse look
    const arrowDirection = new THREE.Vector3(
      horizontalDir.x * Math.cos(verticalLook),
      Math.sin(verticalLook),
      horizontalDir.z * Math.cos(verticalLook)
    ).normalize();
    
    // Create new arrow
    const newArrow = {
      id: `arrow-${Date.now()}`,
      position: arrowPosition,
      direction: arrowDirection
    };
    
    setArrows(prev => [...prev, newArrow]);
    setInventory(prev => ({ ...prev, arrows: prev.arrows - 1 }));
  }, [inventory.arrows, playerPosition, playerRotation, verticalLook]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);
      
      // Handle spacebar for shooting
      if (key === ' ' && !e.repeat) {
        e.preventDefault();
        shootArrow();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shootArrow]);

  // Mouse controls
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPointerLocked.current) {
        mouseMovement.current.x = e.movementX;
        mouseMovement.current.y = e.movementY;
      }
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement !== null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  // Request pointer lock on canvas click
  const handleCanvasClick = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas && !isPointerLocked.current) {
      canvas.requestPointerLock();
    }
  }, []);

  // Create enterTerritory callback
  const enterTerritoryCallback = useCallback(() => {
    // Timer disabled - allow immediate entry
    // if (spawnTimer > 0) {
    //   alert(`You must wait ${spawnTimer} seconds before entering the battlefield!`);
    //   return;
    // }
    setCurrentRoom('territory');
    setPlayerPosition(new THREE.Vector3(0, 0.5, 0)); // Center of territory battlefield
  }, []);

  // Use refs for smoother movement
  const playerRotationRef = useRef(playerRotation);
  const playerPositionRef = useRef(playerPosition);
  const verticalLookRef = useRef(verticalLook);
  
  // Update refs when state changes
  useEffect(() => {
    playerRotationRef.current = playerRotation;
  }, [playerRotation]);
  
  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);
  
  useEffect(() => {
    verticalLookRef.current = verticalLook;
  }, [verticalLook]);

  // Movement update loop
  useEffect(() => {
    const updateMovement = () => {
      const moveSpeed = 0.1; // Reduced for smoother movement
      const rotSpeed = 0.02;
      
      let moved = false;
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      
      // Update rotation based on mouse movement (inverted to fix direction)
      if (mouseMovement.current.x !== 0) {
        const newRotation = playerRotationRef.current - mouseMovement.current.x * rotSpeed;
        playerRotationRef.current = newRotation;
        setPlayerRotation(newRotation);
        mouseMovement.current.x = 0;
      }
      
      // Update vertical look based on mouse Y movement
      if (mouseMovement.current.y !== 0) {
        const newLook = verticalLookRef.current - mouseMovement.current.y * rotSpeed;
        const clampedLook = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, newLook));
        verticalLookRef.current = clampedLook;
        setVerticalLook(clampedLook);
        mouseMovement.current.y = 0;
      }
      
      // Calculate movement vectors based on character rotation
      const currentRotation = playerRotationRef.current;
      forward.set(Math.sin(currentRotation), 0, Math.cos(currentRotation));
      // Fix: Reversed the signs to make "a" move left, "d" move right
      right.set(-Math.cos(currentRotation), 0, Math.sin(currentRotation));
      
      const movement = new THREE.Vector3();
      
      // WASD / Arrow key movement
      if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
        movement.add(forward);
        moved = true;
      }
      if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
        movement.sub(forward);
        moved = true;
      }
      if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
        movement.sub(right);
        moved = true;
      }
      if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
        movement.add(right);
        moved = true;
      }
      
      if (moved) {
        movement.normalize().multiplyScalar(moveSpeed);
        const currentPos = playerPositionRef.current;
        const newPosition = new THREE.Vector3(
          currentPos.x + movement.x,
          currentPos.y,
          currentPos.z + movement.z
        );
        
        // Check door collision (door is at x=8, z=0)
        if (currentRoom === 'spawn' && 
            newPosition.x > 6.5 && newPosition.x < 9.5 &&
            newPosition.z > -2 && newPosition.z < 2) {
          enterTerritoryCallback();
        } else {
          playerPositionRef.current = newPosition;
          setPlayerPosition(newPosition.clone());
        }
      }
      
      setIsMoving(moved);
    };

    const interval = setInterval(updateMovement, 16);
    return () => clearInterval(interval);
  }, [currentRoom, enterTerritoryCallback]);

  return (
    <div className="relative w-full h-screen">
      {/* HUD */}
      <div className="absolute top-20 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg z-10">
        <h3 className="font-bold text-lg mb-2">{player.screenName}</h3>
        <p>Faction: {factions[player.faction].name}</p>
        <p>Health: {player.health}/100</p>
        <p>Arrows: {inventory.arrows}</p>
        <p>Bombs: {inventory.bombs}</p>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg z-10 max-w-md">
        <p className="font-bold mb-1">Controls:</p>
        <p>WASD or Arrow Keys - Move</p>
        <p>Mouse - Look around (click to lock cursor)</p>
        <p>Space - Shoot arrow</p>
        <p>ESC - Release cursor</p>
        {currentRoom === 'spawn' && (
          <p className="mt-2 text-yellow-400">
            Walk through the GOLDEN DOOR to enter the battlefield!
          </p>
        )}
      </div>

      {/* Crosshair */}
      {isPointerLocked.current && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="w-1 h-4 bg-white"></div>
          <div className="w-4 h-1 bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      )}

      {/* Map Button */}
      <button
        onClick={() => setShowMap(!showMap)}
        className="absolute bottom-4 right-4 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg shadow-lg z-30 font-bold"
      >
        {showMap ? 'Close Map' : 'Map'}
      </button>

      {/* Minimap Overlay */}
      {showMap && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-90 p-4 rounded-lg z-40">
          <h3 className="text-white text-xl font-bold mb-2 text-center">Kingdom Map</h3>
          <div className="relative bg-gray-800 rounded" style={{ width: '600px', height: '600px' }}>
            {/* Map territories */}
            {Object.entries(factions).map(([id, faction]) => {
              const territory = faction.territory;
              const scale = 0.6;
              const offsetX = 300;
              const offsetY = 300;
              
              return (
                <div
                  key={id}
                  className="absolute border-2"
                  style={{
                    left: (territory.x * scale) + offsetX,
                    top: (territory.y * scale) + offsetY,
                    width: territory.width * scale,
                    height: territory.height * scale,
                    backgroundColor: faction.color + '40',
                    borderColor: faction.color
                  }}
                >
                  <div className="text-white text-xs p-1 text-center">
                    <div className="font-bold">{faction.name}</div>
                    <div>Treasury: {faction.treasury} SOL</div>
                    <div>Members: {faction.members.length}</div>
                  </div>
                </div>
              );
            })}
            
            {/* Player position (red dot) */}
            <div
              className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white z-50"
              style={{
                left: (playerPosition.x * 0.6) + 300 - 6,
                top: (playerPosition.z * 0.6) + 300 - 6
              }}
            />
            
            {/* Legend */}
            <div className="absolute bottom-2 left-2 text-white text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Your Position</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowMap(false)}
            className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
          >
            Close Map
          </button>
        </div>
      )}

      {/* 3D Scene */}
      <Canvas
        shadows
        style={{ background: '#87CEEB' }}
        onClick={handleCanvasClick}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Third-person camera */}
        <ThirdPersonCamera target={playerPosition} rotation={playerRotation} verticalLook={verticalLook} />

        {/* Ground */}
        <Ground />

        {/* Player Character */}
        <CharacterModel
          faction={player.faction}
          position={[playerPosition.x, playerPosition.y, playerPosition.z]}
          rotation={playerRotation}
          isMoving={isMoving}
        />
        
        {/* Arrows */}
        {arrows.map(arrow => (
          <Arrow3D
            key={arrow.id}
            position={arrow.position.clone()}
            direction={arrow.direction.clone()}
            onRemove={() => {
              setArrows(prev => prev.filter(a => a.id !== arrow.id));
            }}
          />
        ))}

        {/* Spawn room elements */}
        {currentRoom === 'spawn' && (
          <>
            {/* Walls */}
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
            
            {/* Exit door - clickable */}
            <mesh 
              position={[8, 1.5, 0]}
              onClick={(e) => {
                e.stopPropagation();
                enterTerritoryCallback();
              }}
            >
              <boxGeometry args={[0.5, 3, 3]} />
              <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
            </mesh>
            
            {/* Door frame for visual clarity */}
            <mesh position={[8.1, 1.5, 0]}>
              <boxGeometry args={[0.1, 3.2, 3.2]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            
            {/* "EXIT" text above door */}
            <mesh position={[8, 3.2, 0]}>
              <boxGeometry args={[0.1, 0.5, 2]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.2} />
            </mesh>
          </>
        )}

        {/* Territory markers and castles */}
        {currentRoom === 'territory' && Object.entries(factions).map(([id, faction]) => {
          const territory = faction.territory;
          const scale = 0.1;
          const centerX = (territory.x + territory.width / 2) * scale;
          const centerZ = (territory.y + territory.height / 2) * scale;
          
          return (
            <group key={id}>
              {/* Territory platform */}
              <mesh
                position={[centerX, 0.1, centerZ]}
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
              
              {/* Castle for each faction - MUCH BIGGER */}
              <Castle3D
                position={[centerX, 0.2, centerZ]}
                color={faction.color}
                scale={3}
              />
              
              {/* Castle perimeter walls */}
              <CastleWalls3D
                width={territory.width * scale * 0.8}
                height={territory.height * scale * 0.8}
                position={[centerX, 0, centerZ]}
                color={faction.color}
              />
            </group>
          );
        })}
        
        {/* Mountains around the perimeter */}
        {currentRoom === 'territory' && (
          <>
            {/* North mountain range */}
            {Array.from({ length: 15 }).map((_, i) => (
              <Mountain3D
                key={`north-${i}`}
                position={[-150 + i * 20, 0, -180]}
                scale={1 + Math.random() * 0.5}
              />
            ))}
            
            {/* South mountain range */}
            {Array.from({ length: 15 }).map((_, i) => (
              <Mountain3D
                key={`south-${i}`}
                position={[-150 + i * 20, 0, 180]}
                scale={1 + Math.random() * 0.5}
              />
            ))}
            
            {/* East mountain range */}
            {Array.from({ length: 15 }).map((_, i) => (
              <Mountain3D
                key={`east-${i}`}
                position={[180, 0, -150 + i * 20]}
                scale={1 + Math.random() * 0.5}
              />
            ))}
            
            {/* West mountain range */}
            {Array.from({ length: 15 }).map((_, i) => (
              <Mountain3D
                key={`west-${i}`}
                position={[-180, 0, -150 + i * 20]}
                scale={1 + Math.random() * 0.5}
              />
            ))}
          </>
        )}
      </Canvas>
    </div>
  );
};

export default Battlefield3D;