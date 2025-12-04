import React, { Suspense, useRef, useEffect, useState, createContext, useContext, useMemo } from "react";
import { Canvas, useFrame, useThree, ThreeEvent, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations, Plane, Box, Ring, Billboard, Html } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import RunescapeChatBox from "./RunescapeChatBox";
import RuneconButtons from "./RuneconButtons";
import Minimap from "./Minimap";
import TokenInfoButton from "./TokenInfoButton";
import { GrandExchangeNPC } from "./GrandExchangeNPC";
import { GrandExchangePopup } from "./GrandExchangePopup";
import { GrandExchangeArea } from "./GrandExchangeArea";
import { useSocketMultiplayer } from "@/hooks/useSocketMultiplayer";
import { SocketOtherPlayer } from "./multiplayer/SocketOtherPlayer";
import { TokenLaunchesFeed } from "./TokenLaunchesFeed";
import { PlayerChatSubscription } from "./PlayerChatSubscriptionFixed";

// Create a context for GameController functions
const GameControllerContext = createContext<{
  handleGroundClick?: (point: THREE.Vector3) => void;
}>({});


function Map() {
  const { scene } = useGLTF("/models/grandexchangenewmap.glb");
  const mapRef = useRef<THREE.Group>(null);
  
  
  return (
    <>
      {/* Map model */}
      <group ref={mapRef} pointerEvents="none">
        <primitive object={scene} position={[0, -7, 0]} scale={[75, 75, 75]} />
      </group>
    </>
  );
}

function Character({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/character.glb");
  return <primitive object={scene} position={[position[0], position[1] - 8, position[2] + 26]} scale={[1, 1, 1]} />;
}

// Grass ground that extends beyond the map
function GrassGround() {
  const gameControllerContext = useContext(GameControllerContext);
  
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    // Only handle left clicks
    if (event.button !== 0) return;
    
    // Prevent event propagation to avoid conflicts
    event.stopPropagation();
    
    // Get the click point
    const point = event.point;
    
    // Call the ground click handler from GameController context
    if (gameControllerContext?.handleGroundClick) {
      gameControllerContext.handleGroundClick(point);
    }
  };
  
  return (
    <Plane 
      args={[500, 500]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.1, 0]}
      receiveShadow
      onPointerDown={handlePointerDown}
    >
      <meshStandardMaterial color="#1a7a1a" roughness={1} />
    </Plane>
  );
}

// Low-poly Tree Component
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1.2, 8]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      {/* Leaves - stacked cones for low-poly look */}
      <mesh position={[0, 10, 0]} castShadow>
        <coneGeometry args={[4, 6, 6]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      <mesh position={[0, 13, 0]} castShadow>
        <coneGeometry args={[3.2, 5, 6]} />
        <meshStandardMaterial color="#32CD32" />
      </mesh>
      <mesh position={[0, 15.5, 0]} castShadow>
        <coneGeometry args={[2.4, 4, 6]} />
        <meshStandardMaterial color="#3CB371" />
      </mesh>
    </group>
  );
}

// Bush/Shrub Component
function Bush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main bush body */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[2, 8, 6]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      {/* Secondary bush parts for irregular shape */}
      <mesh position={[1, 1.2, 0.5]} castShadow>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshStandardMaterial color="#32CD32" />
      </mesh>
      <mesh position={[-0.8, 1.8, -0.3]} castShadow>
        <sphereGeometry args={[1.2, 8, 6]} />
        <meshStandardMaterial color="#3CB371" />
      </mesh>
    </group>
  );
}

// Tall Grass Component
function TallGrass({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Multiple grass blades */}
      <mesh position={[0, 1, 0]} rotation={[0, 0, 0.1]} castShadow>
        <boxGeometry args={[0.1, 2, 0.1]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      <mesh position={[0.3, 0.8, 0.2]} rotation={[0, 0.3, -0.1]} castShadow>
        <boxGeometry args={[0.1, 1.6, 0.1]} />
        <meshStandardMaterial color="#32CD32" />
      </mesh>
      <mesh position={[-0.2, 1.2, -0.1]} rotation={[0, -0.2, 0.15]} castShadow>
        <boxGeometry args={[0.1, 2.4, 0.1]} />
        <meshStandardMaterial color="#3CB371" />
      </mesh>
    </group>
  );
}

// Greenery Collection Component
function TerrainGreenery() {
  const treePositions = [
    [-200, 0, -200], [200, 0, -200], [-200, 0, 200], [200, 0, 200],
    [-180, 0, -150], [180, 0, -150], [-180, 0, 150], [180, 0, 150],
    [-150, 0, -180], [150, 0, -180], [-150, 0, 180], [150, 0, 180],
    [-220, 0, 0], [220, 0, 0], [0, 0, -220], [0, 0, 220],
    [-160, 0, -120], [160, 0, -120], [-160, 0, 120], [160, 0, 120],
    [-120, 0, -160], [120, 0, -160], [-120, 0, 160], [120, 0, 160]
  ];

  const bushPositions = [
    [-170, 0, -170], [170, 0, -170], [-170, 0, 170], [170, 0, 170],
    [-190, 0, -100], [190, 0, -100], [-190, 0, 100], [190, 0, 100],
    [-100, 0, -190], [100, 0, -190], [-100, 0, 190], [100, 0, 190],
    [-130, 0, -210], [130, 0, -210], [-130, 0, 210], [130, 0, 210],
    [-210, 0, -130], [210, 0, -130], [-210, 0, 130], [210, 0, 130],
    [-140, 0, -140], [140, 0, -140], [-140, 0, 140], [140, 0, 140]
  ];

  const grassPositions = [
    [-150, 0, -150], [150, 0, -150], [-150, 0, 150], [150, 0, 150],
    [-165, 0, -85], [165, 0, -85], [-165, 0, 85], [165, 0, 85],
    [-85, 0, -165], [85, 0, -165], [-85, 0, 165], [85, 0, 165],
    [-175, 0, -50], [175, 0, -50], [-175, 0, 50], [175, 0, 50],
    [-50, 0, -175], [50, 0, -175], [-50, 0, 175], [50, 0, 175],
    [-125, 0, -125], [125, 0, -125], [-125, 0, 125], [125, 0, 125]
  ];

  return (
    <>
      {/* Trees around the outer edges */}
      {treePositions.map((pos, i) => (
        <Tree key={`tree-${i}`} position={pos as [number, number, number]} />
      ))}
      
      {/* Bushes in the middle ring */}
      {bushPositions.map((pos, i) => (
        <Bush key={`bush-${i}`} position={pos as [number, number, number]} />
      ))}
      
      {/* Tall grass closer to the center */}
      {grassPositions.map((pos, i) => (
        <TallGrass key={`grass-${i}`} position={pos as [number, number, number]} />
      ))}
    </>
  );
}

// OtherPlayer Component - For rendering other players in multiplayer
function OtherPlayer({ 
  position,
  name,
  chatMessage,
  chatTimestamp,
  modelType,
  direction,
  isMoving
}: { 
  position: { x: number; y: number; z: number };
  name: string;
  chatMessage?: string;
  chatTimestamp?: number;
  modelType?: string;
  direction?: string;
  isMoving?: boolean;
}) {
  // Use the model type passed from the database, or default to red_blue_white.glb
  const modelPath = modelType && modelType !== 'default' 
    ? `/models/${modelType}` 
    : '/models/red_blue_white.glb';
  
  // Debug log to check if model is being passed
  console.log('[OtherPlayer] Rendering player:', name, 'with model:', modelType, 'path:', modelPath);
  
  const { scene, animations } = useGLTF(modelPath);
  
  // Convert direction string to rotation angle
  const getRotationFromDirection = (dir: string): number => {
    const directionMap: { [key: string]: number } = {
      'N': 0,                 // Face north when moving north
      'NE': -Math.PI / 4,     // Face northeast when moving northeast
      'E': -Math.PI / 2,      // Face east when moving east
      'SE': -3 * Math.PI / 4, // Face southeast when moving southeast
      'S': Math.PI,           // Face south when moving south
      'SW': 3 * Math.PI / 4,  // Face southwest when moving southwest
      'W': Math.PI / 2,       // Face west when moving west
      'NW': Math.PI / 4       // Face northwest when moving northwest
    };
    return directionMap[dir] || 0;
  };
  
  // Deep-clone once per component instance
  const model = useMemo(() => {
    if (!scene) return null;
    return SkeletonUtils.clone(scene);
  }, [scene]);
  
  // Make sure matrices keep updating (Unity exports often set this false)
  useEffect(() => {
    if (model) {
      model.traverse((o) => {
        o.matrixAutoUpdate = true;
      });
    }
  }, [model]);
  
  // Create mixer + actions bound to THIS clone
  const { actions, mixer } = useAnimations(animations, model);
  
  // Update animation mixer every frame
  useFrame((state, delta) => {
    if (mixer) {
      // Clamp delta to prevent animation jumps when tab regains focus
      const clampedDelta = Math.min(delta, 0.1);
      mixer.update(clampedDelta);
    }
  });
  
  // Drive walk vs idle based on isMoving
  useEffect(() => {
    if (!actions) return;
    
    // Find animation clips (adjust names to match your GLB)
    const walk = actions['Walk'] || actions['walk'] || actions[Object.keys(actions)[0]];
    const idle = actions['Idle'] || actions['idle'];
    
    if (isMoving) {
      idle?.fadeOut(0.2);
      walk?.reset().fadeIn(0.2).play();
      console.log('[OtherPlayer] Playing walk animation for:', name);
    } else {
      walk?.fadeOut(0.2);
      idle?.reset().fadeIn(0.2).play();
      console.log('[OtherPlayer] Playing idle animation for:', name);
    }
  }, [isMoving, actions, name]);
  
  // Cleanup animation mixer on unmount
  useEffect(() => {
    return () => {
      if (mixer) {
        mixer.stopAllAction();
        if (model) {
          mixer.uncacheRoot(model);
        }
      }
    };
  }, [mixer, model]);
  
  if (!model) {
    // Show loading cube
    return (
      <group position={[position.x, position.y, position.z]}>
        <Box args={[5, 10, 5]} position={[0, 5, 0]}>
          <meshStandardMaterial color="gray" />
        </Box>
      </group>
    );
  }
  
  // Calculate rotation based on direction
  const rotation = direction ? getRotationFromDirection(direction) : 0;
  
  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
      {/* Use properly cloned model */}
      <primitive 
        object={model} 
        scale={[50, 50, 50]} 
        position={[0, 3, 26]} 
        dispose={null}
      />
      
      {/* Show either chat message or player name */}
      <Html 
        position={[0, 17, 0]} 
        center
        style={{ fontSize: '14px' }}
      >
        <div style={{
          color: 'yellow',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none'
        }}>
          {chatMessage && chatTimestamp && Date.now() - chatTimestamp < 5000 ? chatMessage : name}
        </div>
      </Html>
      
      {/* Red beam for debuggissng */}
      {/* <mesh position={[0, 25, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 30]} />
        <meshBasicMaterial color="red" />
      </mesh> */}
    </group>
  );
}

// Player Component - Using the customized player model
function Player({ 
  position, 
  rotation, 
  isMoving,
  characterModel,
  chatMessage,
  chatMessageTime,
  username
}: { 
  position: THREE.Vector3; 
  rotation: number;
  isMoving: boolean;
  characterModel?: string;
  chatMessage?: string;
  chatMessageTime?: number;
  username?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Use the model passed from parent (from database) or fallback to localStorage
  const characterData = JSON.parse(localStorage.getItem('characterData') || '{}');
  const modelPath = characterModel || characterData.characterModel || 'blue_blue_white.glb';
  const displayName = username || characterData.username || 'Player';
  
  const { scene, animations } = useGLTF(`/models/${modelPath}`);
  const [modelReady, setModelReady] = useState(false);
  
  // Deep-clone the model using SkeletonUtils
  const model = useMemo(() => {
    if (!scene) return null;
    return SkeletonUtils.clone(scene);
  }, [scene]);
  
  // Clone animations to ensure each player has unique instances
  const clonedAnimations = useMemo(() => {
    if (!animations || animations.length === 0) {
      return [];
    }
    return animations.map(clip => clip.clone());
  }, [animations]);
  
  // Setup animations with cloned animations and groupRef
  const { mixer, actions } = useAnimations(clonedAnimations, groupRef);
  
  
  useEffect(() => {
    if (!model) {
      // Force model ready after timeout to prevent permanent invisibility
      const timeout = setTimeout(() => {
        setModelReady(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }
    
    // Setup shadows and ensure visibility for all meshes
    model.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.visible = true;
        child.frustumCulled = false; // Prevent culling issues
      }
      // CRITICAL: Ensure matrices keep updating
      child.matrixAutoUpdate = true;
    });
    
    setModelReady(true);
  }, [model]);
  
  
  
  
  
  // Handle walking animation based on isMoving state
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      return;
    }
    
    const animationNames = Object.keys(actions);
    if (animationNames.length === 0) return;
    
    // Use the first available animation (walking animation)
    const walkAnimation = actions[animationNames[0]];
    if (!walkAnimation) {
      return;
    }
    
    // Play or stop animation based on movement
    if (isMoving) {
      walkAnimation.reset();
      walkAnimation.fadeIn(0.1);
      walkAnimation.play();
    } else {
      walkAnimation.fadeOut(0.2);
    }
  }, [isMoving, actions]);
  
  useFrame((state, delta) => {
    if (mixer) {
      // Clamp delta to prevent animation jumps when tab regains focus
      const clampedDelta = Math.min(delta, 0.1);
      mixer.update(clampedDelta);
    }
  });
  
  // Cleanup animation mixer on unmount
  useEffect(() => {
    return () => {
      if (mixer) {
        mixer.stopAllAction();
        if (groupRef.current) {
          mixer.uncacheRoot(groupRef.current);
        }
      }
    };
  }, [mixer]);
  
  

  // Show a fallback cube if model isn't ready
  if (!modelReady || !model) {
    return (
      <group position={position} rotation={[0, rotation, 0]}>
        <Box args={[5, 10, 5]} position={[0, 5, 0]}>
          <meshStandardMaterial color="red" wireframe />
        </Box>
      </group>
    );
  }
  
  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={model} scale={[50, 50, 50]} position={[0, 3, 26]} />
      
      
      {/* Username - always visible */}
      <Html 
        position={[0, 17, 0]} 
        center
        style={{
          fontSize: '14px'
        }}
      >
        <div style={{
          color: 'yellow',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none'
        }}>
          {displayName}
        </div>
      </Html>
      
      {/* Real-time chat subscription for local player */}
      {characterData.userId && (
        <PlayerChatSubscription playerId={characterData.userId} position={[0, 22, 0]} />
      )}
    </group>
  );
}

// Click Marker Component
function ClickMarker({ position }: { position: THREE.Vector3 | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, '/gold-ring.png');
  const { camera } = useThree();
  
  useFrame(() => {
    if (!meshRef.current || !position) return;
    // Keep flat on ground but rotate to face camera direction
    const cameraYRotation = Math.atan2(camera.position.x - position.x, camera.position.z - position.z);
    meshRef.current.rotation.set(-Math.PI / 2, 0, cameraYRotation);
  });
  
  if (!position) return null;
  
  return (
    <group position={[position.x, position.y + 0.1, position.z]}>
      {/* Gold ring image - flat on ground but upright relative to camera */}
      <Plane ref={meshRef} args={[8.0, 8.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial map={texture} transparent={true} />
      </Plane>
    </group>
  );
}

// Top-Down Camera Controller
function TopDownCamera({ 
  target, 
  zoomDistance,
  cameraRotation,
  cameraPitch
}: { 
  target: THREE.Vector3; 
  zoomDistance: number;
  cameraRotation: number;
  cameraPitch: number;
}) {
  const { camera } = useThree();
  const smoothedTarget = useRef(new THREE.Vector3());
  
  useFrame(() => {
    // Smooth target following
    smoothedTarget.current.lerp(target, 0.1);
    
    // Calculate camera position for adjustable angle view
    const horizontalDistance = zoomDistance * Math.cos(cameraPitch);
    const verticalDistance = zoomDistance * Math.sin(cameraPitch);
    
    // Position camera based on rotation
    const cameraX = smoothedTarget.current.x - Math.sin(cameraRotation) * horizontalDistance;
    const cameraZ = smoothedTarget.current.z - Math.cos(cameraRotation) * horizontalDistance;
    const cameraY = smoothedTarget.current.y + verticalDistance;
    
    camera.position.set(cameraX, cameraY, cameraZ);
    
    // Look at player center - adjust Y offset for proper centering
    camera.lookAt(smoothedTarget.current.x, smoothedTarget.current.y + 2, smoothedTarget.current.z);
  });
  
  return null;
}

// Ground Click Handler
function GroundPlane({ onGroundClick }: { onGroundClick: (point: THREE.Vector3) => void }) {
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    // Only handle left clicks
    if (event.button !== 0) return;
    
    // Prevent default to avoid browser interactions
    event.stopPropagation();
    
    onGroundClick(event.point);
  };
  
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0.5, 0]}
      onPointerDown={handlePointerDown}
      onPointerMissed={() => {}}
      renderOrder={999}
      raycast={THREE.Mesh.prototype.raycast}
    >
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial 
        transparent={true}
        opacity={0} 
        side={THREE.DoubleSide} 
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

// Combined Player and Camera Controller
function GameController({ 
  playerPosition,
  setPlayerPosition,
  playerRotation,
  setPlayerRotation,
  showPlayer = true,
  characterModel,
  updateLocalPlayer,
  players,
  username,
  currentPlayerId,
  chatMessage,
  chatMessageTime
}: { 
  playerPosition: THREE.Vector3;
  setPlayerPosition: (pos: THREE.Vector3) => void;
  playerRotation: number;
  setPlayerRotation: (rot: number) => void;
  showPlayer?: boolean;
  characterModel?: string;
  updateLocalPlayer?: (position: { x: number; z: number }, rotation: number, isMoving: boolean) => void;
  players?: Map<string, any>;
  username?: string;
  currentPlayerId?: string;
  chatMessage?: string;
  chatMessageTime?: number;
}) {
  const [clickMarkerPosition, setClickMarkerPosition] = useState<THREE.Vector3 | null>(null);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [cameraPitch, setCameraPitch] = useState(Math.PI / 3); // 60 degrees default
  const [zoomDistance, setZoomDistance] = useState(30);
  const [targetZoomDistance, setTargetZoomDistance] = useState(30);
  const [isMoving, setIsMoving] = useState(false);
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  
  const mouseDown = useRef(false);
  const pitchMouseDown = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const moveSpeed = 0.25; // Increased for more responsive movement (15 units/second at 60fps)
  const lastSentPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const positionUpdateTimer = useRef<number>(0);
  const positionUpdateInterval = 50; // Send position updates every 50ms for smoother movement
  const frameCountRef = useRef(0);

  // Helper function to get direction string from angle
  const getDirectionString = (angle: number) => {
    const normalized = ((angle + Math.PI) / (2 * Math.PI)) * 8;
    const index = Math.round(normalized) % 8;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[index];
  };

  // Handle ground clicks for movement
  const handleGroundClick = (point: THREE.Vector3) => {
    console.log('[Movement] Ground clicked at:', { x: point.x.toFixed(1), z: point.z.toFixed(1) });
    
    // Validate the click point
    if (!point || isNaN(point.x) || isNaN(point.y) || isNaN(point.z)) {
      console.error('[Movement] Invalid click point:', point);
      return;
    }
    
    setClickMarkerPosition(new THREE.Vector3(point.x, point.y, point.z));
    setTargetPosition(new THREE.Vector3(point.x, 0, point.z));
    
    // Calculate rotation immediately and update it
    const currentPos = playerPosition.clone();
    const direction = new THREE.Vector2(
      point.x - currentPos.x,
      point.z - currentPos.z
    );
    const angle = Math.atan2(direction.x, direction.y);
    setPlayerRotation(angle);
    setIsMoving(true);
  };

  
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right click for camera rotation
        mouseDown.current = true;
        lastMouseX.current = e.clientX;
        e.preventDefault();
      } else if (e.button === 1) { // Middle click for camera pitch
        pitchMouseDown.current = true;
        lastMouseY.current = e.clientY;
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      mouseDown.current = false;
      pitchMouseDown.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDown.current) {
        const deltaX = e.clientX - lastMouseX.current;
        setCameraRotation(prev => prev - deltaX * 0.005);
        lastMouseX.current = e.clientX;
      }
      if (pitchMouseDown.current) {
        const deltaY = e.clientY - lastMouseY.current;
        setCameraPitch(prev => Math.max(Math.PI / 6, Math.min(Math.PI / 2, prev + deltaY * 0.005))); // 30 to 90 degrees
        lastMouseY.current = e.clientY;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      setTargetZoomDistance(prev => Math.max(15, Math.min(150, prev + e.deltaY * 0.02)));
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Handle player movement
  useFrame((state, delta) => {
    // Prevent huge delta times when tab is unfocused or page is hidden
    const clampedDelta = Math.min(delta, 0.1); // Cap at 100ms (10 FPS minimum)
    
    // Smooth zoom interpolation
    setZoomDistance(prev => prev + (targetZoomDistance - prev) * 0.1);
    
    // Handle local player movement
    if (targetPosition && isMoving) {
      // Additional check for page visibility
      if (document.hidden) {
        // If page is hidden, pause movement entirely
        return;
      }
      
      const currentPos = playerPosition.clone();
      const direction = new THREE.Vector2(
        targetPosition.x - currentPos.x,
        targetPosition.z - currentPos.z
      );
      const distance = direction.length();
      
      if (distance < 1) {
        // Reached target
        setPlayerPosition(targetPosition.clone());
        setIsMoving(false);
        setTargetPosition(null);
        setClickMarkerPosition(null);
        
        // Send final position when stopped
        if (updateLocalPlayer) {
          updateLocalPlayer(
            { x: targetPosition.x, z: targetPosition.z },
            playerRotation,
            false // not moving
          );
        }
      } else {
        // Move towards target with clamped delta
        direction.normalize();
        const newX = currentPos.x + direction.x * moveSpeed * clampedDelta * 60;
        const newZ = currentPos.z + direction.y * moveSpeed * clampedDelta * 60;
        const newPos = new THREE.Vector3(newX, 0, newZ);
        setPlayerPosition(newPos);
        
        // Update rotation
        const angle = Math.atan2(direction.x, direction.y);
        setPlayerRotation(angle);
        
        // Send position update to other players
        if (updateLocalPlayer) {
          updateLocalPlayer(
            { x: newPos.x, z: newPos.z },
            angle,
            true // isMoving
          );
        }
      }
    }
  });

  // Simple frame counter
  useFrame(() => {
    frameCountRef.current++;
  });

  return (
    <GameControllerContext.Provider value={{ handleGroundClick }}>
      {showPlayer && <ClickMarker position={clickMarkerPosition} />}
      
      {/* Render local player */}
      {showPlayer && (
        <Player
          position={playerPosition}
          rotation={playerRotation}
          isMoving={isMoving}
          characterModel={characterModel}
          chatMessage={chatMessage}
          chatMessageTime={chatMessageTime}
          username={username}
        />
      )}
      
      
      <TopDownCamera 
        target={playerPosition} 
        zoomDistance={zoomDistance}
        cameraRotation={cameraRotation}
        cameraPitch={cameraPitch}
      />
      
      {/* Ground plane for clicks - rendered last to be on top */}
      <GroundPlane onGroundClick={handleGroundClick} />
    </GameControllerContext.Provider>
  );
}

interface RunescapeWorldProps {
  playerData?: {
    username: string;
    skinColor: string;
    shirtColor: string;
    pantsColor: string;
    characterModel?: string;
    userId?: string;
  } | null;
}

const RunescapeWorld = ({ playerData }: RunescapeWorldProps) => {
  const [showChat, setShowChat] = useState(true); // Always show chat
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(-80, 0, 0)); // Spawn at ground level
  const [playerRotation, setPlayerRotation] = useState(-Math.PI / 2); // Face towards center
  const [showGrandExchange, setShowGrandExchange] = useState(false);
  const [localChatMessage, setLocalChatMessage] = useState<string>("");
  const [localChatMessageTime, setLocalChatMessageTime] = useState<number>(0);
  
  // CRITICAL: isSignedIn state - only true when player has logged in!
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  // Set isSignedIn when playerData is available
  useEffect(() => {
    if (playerData?.username && playerData?.userId) {
      console.log('[RunescapeWorld] User signed in:', playerData.username);
      setIsSignedIn(true);
    } else {
      setIsSignedIn(false);
    }
  }, [playerData]);

  // Initialize Socket.io multiplayer system ONLY when signed in
  const {
    players,
    isConnected,
    latency,
    updateLocalPlayer,
    sendChatMessage,
    playersCount
  } = useSocketMultiplayer({
    username: playerData?.username || '',
    modelFile: playerData?.characterModel || 'red_blue_white.glb',
    userId: playerData?.userId || '',
    currentMap: 'grand-exchange',
    isSignedIn: isSignedIn // Pass isSignedIn state!
  });


  // Log multiplayer status changes
  useEffect(() => {
    console.log('[SocketMultiplayer] Status:', {
      isSignedIn,
      isConnected,
      playersCount,
      latency,
      playerData: playerData ? { username: playerData.username, model: playerData.characterModel } : null
    });
  }, [isSignedIn, isConnected, playersCount, latency, playerData]);


  useEffect(() => {
    // Ensure font is loaded for floating text and add pulse animation
    const style = document.createElement('style');
    style.innerHTML = `
      .floating-chat-text {
        font-family: 'Pixelify Sans', monospace !important;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1.2);
        }
        50% {
          transform: scale(1.3);
        }
        100% {
          transform: scale(1.2);
        }
      }
    `;
    document.head.appendChild(style);
    
    // Remove keyboard handler since chat is always visible
    // Enter key is reserved for sending messages in the chat
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);


  const handleChatMessage = (message: string) => {
    // Show message above local player's head
    setLocalChatMessage(message);
    setLocalChatMessageTime(Date.now());
    
    // Send to other players via Socket.io
    if (sendChatMessage) {
      sendChatMessage(message);
    }
  };

  const handleRuneconClick = (runeconNumber: number) => {
    // Add any runecon-specific functionality here
  };


  return (
    <div className="fixed inset-0 w-full h-full">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-white bg-black/50 p-2 rounded">
        {playerData ? (
          <div className="text-center">
            <div className="text-yellow-400 font-bold mb-1">Welcome, {playerData.username}!</div>
            <div className="text-sm">Left-click to move | Right-click drag to rotate | Middle-click drag for angle | Scroll to zoom</div>
            <div className="text-xs mt-1">
              <span className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? '🟢' : '🔴'} {isConnected ? 'Connected' : 'Disconnected'} | {playersCount} players online | {latency}ms
              </span>
            </div>
          </div>
        ) : (
          'Left-click to move | Right-click drag to rotate | Middle-click drag for angle | Scroll to zoom'
        )}
      </div>
      
      {/* Runey Toons UI in top right corner with minimap */}
      <div className="absolute top-4 z-30 w-72 h-72" style={{ right: '56px' }}>
        {/* Minimap positioned behind the UI frame */}
        <div 
          className="absolute"
          style={{
            top: '44%',
            left: '62%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            zIndex: 1
          }}
        >
          <Minimap 
            playerPosition={playerPosition}
            playerRotation={playerRotation}
            mapScale={1.0}
          />
        </div>
        {/* UI frame image on top */}
        <img 
          src="/runey-toons-ui.png" 
          alt="Runey Toons UI" 
          className="w-full h-full object-contain absolute inset-0"
          style={{
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      </div>
      
      {playerData && (
        <RunescapeChatBox 
          onClose={() => {}} // Chat is always visible
          onSendMessage={handleChatMessage}
          username={playerData.username}
          userId={playerData.userId}
          playerPosition={{ x: playerPosition.x, z: playerPosition.z }}
        />
      )}
      
      
      {/* Skills Panel - Right side */}
      <div 
        className="fixed right-0 top-0 bottom-0 z-20"
        style={{
          width: '40px',
          backgroundImage: 'url(/skills-panel-right.png)',
          backgroundSize: '40px 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          imageRendering: 'pixelated',
        }}
      />
      
      {/* Runecon Buttons */}
      {playerData && <RuneconButtons onRuneconClick={handleRuneconClick} />}
      
      {/* Token Info Button */}
      {playerData && <TokenInfoButton />}
      
      {/* Token Launches Feed - Under Compass */}
      {playerData && <TokenLaunchesFeed />}
      
      {/* Grand Exchange Popup */}
      <GrandExchangePopup 
        isOpen={showGrandExchange} 
        onClose={() => setShowGrandExchange(false)} 
      />
      
      
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000 }}
        shadows
        gl={{ 
          alpha: false,
          toneMapping: THREE.NoToneMapping,
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
          stencil: false,
          depth: true
        }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor('#000000', 1);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          
          // Set initial camera position
          camera.position.set(-80, 30, -20);
          camera.lookAt(-80, 0, 0);
          
          // Monitor WebGL context
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('[WebGL] Context lost, attempting to restore...');
            // Try to restore context
            setTimeout(() => {
              try {
                // Check if gl has the expected methods
                if (gl && typeof gl.isContextLost === 'function' && gl.isContextLost()) {
                  if (typeof gl.forceContextRestore === 'function') {
                    gl.forceContextRestore();
                  }
                } else {
                  // Don't reload automatically - just log the error
                  console.error('[WebGL] Unable to restore context. Context may need manual restoration.');
                }
              } catch (e) {
                console.error('[WebGL] Error restoring context:', e);
              }
            }, 1000);
          });
          
          canvas.addEventListener('webglcontextrestored', () => {
            console.log('[WebGL] Context restored successfully');
          });
          
          // Set reasonable limits to prevent context loss
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        <hemisphereLight 
          intensity={0.9} 
          color="#ffffff"
          groundColor="#8B7355"
        />
        
        <ambientLight intensity={0.7} color="#ffffff" />
        
        <directionalLight 
          position={[50, 100, 30]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-bias={-0.001}
          color="#ffffff"
        />
        
        <Suspense fallback={
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="gray" />
          </mesh>
        }>
          <GrassGround />
          <Map />
          <TerrainGreenery />
          <GrandExchangeArea 
            playerPosition={playerPosition}
            onOpenGrandExchange={() => setShowGrandExchange(true)}
          />
          <GameController 
            playerPosition={playerPosition}
            setPlayerPosition={setPlayerPosition}
            playerRotation={playerRotation}
            setPlayerRotation={setPlayerRotation}
            showPlayer={true} // Always show player
            characterModel={playerData?.characterModel}
            updateLocalPlayer={updateLocalPlayer}
            players={players}
            username={playerData?.username}
            currentPlayerId={playerData?.userId}
            chatMessage={localChatMessage}
            chatMessageTime={localChatMessageTime}
          />
          
          {/* Render other players at the same level as GameController - Socket.io version */}
          {isConnected ? (
            players && Array.from(players.values()).map(player => {
              console.log('[Render] Rendering Socket.io player:', player.username, 'at', player.position);
              return (
              <SocketOtherPlayer 
                key={player.id} 
                position={player.position}
                direction={player.direction}
                isMoving={player.isMoving}
                isMovingAnim={player.isMovingAnim}
                animPhase={player.animPhase}
                modelFile={player.modelFile}
                username={player.username}
                userId={player.userId}
                chatMessage={player.chatMessage}
                chatMessageTime={player.chatMessageTime}
              />
            );
          })
          ) : (
            <Html center>
              <div style={{ color: 'red', backgroundColor: 'black', padding: '10px' }}>
                Connecting to multiplayer server...
              </div>
            </Html>
          )}
        </Suspense>
        
        <fog attach="fog" args={["#0d0d0d", 70, 450]} />
      </Canvas>
    </div>
  );
};


export default RunescapeWorld;