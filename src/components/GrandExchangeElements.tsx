import { useRef, useMemo, useEffect } from "react";
import { Box, Cylinder, Cone, Sphere, Text } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Merchant Stall Component - Larger scale
function MerchantStall({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Stall counter - much bigger */}
      <Box args={[10, 5, 6]} position={[0, 2.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8B4513" />
      </Box>
      
      {/* Canopy poles */}
      <Cylinder args={[0.3, 0.3, 10]} position={[-4.6, 5, -2.8]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Cylinder>
      <Cylinder args={[0.3, 0.3, 10]} position={[4.6, 5, -2.8]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Cylinder>
      <Cylinder args={[0.3, 0.3, 10]} position={[-4.6, 5, 2.8]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Cylinder>
      <Cylinder args={[0.3, 0.3, 10]} position={[4.6, 5, 2.8]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Cylinder>
      
      {/* Canopy roof - much bigger */}
      <Box args={[11, 0.6, 7]} position={[0, 10, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#FF6347" />
      </Box>
      
      {/* Items on display - much bigger */}
      <Box args={[1, 1, 1]} position={[-1.6, 5.5, 0]} castShadow>
        <meshStandardMaterial color="#FFD700" />
      </Box>
      <Sphere args={[0.7]} position={[0, 5.5, 0]} castShadow>
        <meshStandardMaterial color="#FF1493" />
      </Sphere>
      <Cylinder args={[0.5, 0.5, 1.2]} position={[1.6, 5.5, 0]} castShadow>
        <meshStandardMaterial color="#00CED1" />
      </Cylinder>
    </group>
  );
}

// NPC Merchant Component
function Merchant({ position }: { position: [number, number, number] }) {
  const colors = ["#FFE4B5", "#8B7355", "#FFE4C4", "#DEB887"];
  const color = useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);
  
  return (
    <group position={position}>
      {/* Body - 3x bigger */}
      <Box args={[2.4, 4.8, 1.2]} position={[0, 2.4, 0]} castShadow>
        <meshStandardMaterial color="#4169E1" />
      </Box>
      {/* Head - 3x bigger */}
      <Box args={[1.5, 1.5, 1.5]} position={[0, 5.55, 0]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      {/* Hat - 3x bigger */}
      <Cone args={[1.2, 1.5, 4]} position={[0, 7.05, 0]} castShadow>
        <meshStandardMaterial color="#800080" />
      </Cone>
    </group>
  );
}

// Crowd Character Component
function CrowdCharacter({ position }: { position: [number, number, number] }) {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57"];
  const color = useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);
  
  return (
    <group position={position}>
      {/* Body - 3x bigger */}
      <Box args={[1.8, 4.2, 0.9]} position={[0, 2.1, 0]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      {/* Head - 3x bigger */}
      <Sphere args={[0.75]} position={[0, 4.95, 0]} castShadow>
        <meshStandardMaterial color="#FFE4B5" />
      </Sphere>
    </group>
  );
}

// Bank Booth Component
function BankBooth({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main structure - 4x bigger */}
      <Box args={[16, 12, 12]} position={[0, 6, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#696969" />
      </Box>
      {/* Windows - 4x bigger */}
      <Box args={[14, 4, 0.4]} position={[0, 6, 6.04]} castShadow>
        <meshStandardMaterial color="#87CEEB" opacity={0.7} transparent />
      </Box>
      {/* Counter - 4x bigger */}
      <Box args={[15.2, 1.2, 4]} position={[0, 4, 6]} castShadow>
        <meshStandardMaterial color="#2F4F4F" />
      </Box>
      {/* Bank sign - 4x bigger */}
      <Box args={[8, 2, 0.4]} position={[0, 11.2, 6.04]} castShadow>
        <meshStandardMaterial color="#FFD700" />
      </Box>
    </group>
  );
}

// Low-poly Tree Component
function LowPolyTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk - 4x bigger */}
      <Cylinder args={[1.2, 1.6, 8]} position={[0, 4, 0]} castShadow>
        <meshStandardMaterial color="#8B4513" />
      </Cylinder>
      {/* Leaves - stacked cones for low-poly look - 4x bigger */}
      <Cone args={[6, 8, 6]} position={[0, 12, 0]} castShadow>
        <meshStandardMaterial color="#228B22" />
      </Cone>
      <Cone args={[4.8, 6, 6]} position={[0, 16.8, 0]} castShadow>
        <meshStandardMaterial color="#32CD32" />
      </Cone>
      <Cone args={[3.2, 4, 6]} position={[0, 20.8, 0]} castShadow>
        <meshStandardMaterial color="#3CB371" />
      </Cone>
    </group>
  );
}

// Lamp Post Component
function LampPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base - 3x bigger */}
      <Cylinder args={[0.9, 1.2, 0.9]} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color="#2F4F4F" />
      </Cylinder>
      {/* Post - 3x bigger */}
      <Cylinder args={[0.3, 0.3, 12]} position={[0, 6, 0]} castShadow>
        <meshStandardMaterial color="#1C1C1C" />
      </Cylinder>
      {/* Lamp housing - 3x bigger */}
      <Box args={[1.8, 2.4, 1.8]} position={[0, 13.2, 0]} castShadow>
        <meshStandardMaterial color="#1C1C1C" />
      </Box>
      {/* Light bulb - 3x bigger */}
      <Sphere args={[0.6]} position={[0, 13.2, 0]}>
        <meshStandardMaterial color="#FFFFE0" emissive="#FFFFE0" emissiveIntensity={0.5} />
      </Sphere>
      {/* Point light with increased range */}
      <pointLight position={[0, 13.2, 0]} intensity={1} distance={50} color="#FFF8DC" />
    </group>
  );
}

// Chat Bubble Component
function ChatBubble({ position, text }: { position: [number, number, number]; text: string }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Make bubble bob up and down slightly
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  return (
    <group ref={meshRef} position={position}>
      {/* Bubble background - 2x bigger */}
      <Box args={[8, 2, 0.2]} castShadow>
        <meshStandardMaterial color="#FFFFFF" />
      </Box>
      {/* Bubble tail - 2x bigger */}
      <Cone args={[0.6, 1, 3]} position={[0, -1.4, 0]} rotation={[0, 0, Math.PI]} castShadow>
        <meshStandardMaterial color="#FFFFFF" />
      </Cone>
      {/* Text */}
      <Text
        position={[0, 0, 0.12]}
        fontSize={0.6}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.5}
      >
        {text}
      </Text>
    </group>
  );
}

// Stone Tile Pattern for Ground
function StoneTileGround() {
  const tilesRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  
  // Create radial pattern of tiles - covering larger area
  const tiles = useMemo(() => {
    const positions: [number, number, number][] = [];
    const rings = 25; // More rings to cover larger area
    const tileSize = 8;
    
    // Radial rings starting from inner area
    for (let ring = 5; ring <= rings; ring++) { // Start from ring 5 to avoid center
      const radius = ring * tileSize;
      const tilesInRing = Math.floor((2 * Math.PI * radius) / tileSize);
      
      for (let i = 0; i < tilesInRing; i++) {
        const angle = (i / tilesInRing) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Only place tiles in the market area (between 40-120 units from center)
        const distance = Math.sqrt(x * x + z * z);
        if (distance > 40 && distance < 120) {
          positions.push([x, 0.01, z]);
        }
      }
    }
    
    return positions;
  }, []);
  
  useEffect(() => {
    if (!tilesRef.current) return;
    
    tiles.forEach(([x, y, z], i) => {
      tempObject.position.set(x, y, z);
      tempObject.rotation.y = Math.atan2(x, z);
      tempObject.updateMatrix();
      tilesRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    
    tilesRef.current.instanceMatrix.needsUpdate = true;
  }, [tiles, tempObject]);
  
  return (
    <instancedMesh ref={tilesRef} args={[undefined, undefined, tiles.length]} receiveShadow>
      <boxGeometry args={[8, 0.1, 8]} />
      <meshStandardMaterial color="#A9A9A9" />
    </instancedMesh>
  );
}

// Main Grand Exchange Elements Component
export function GrandExchangeElements() {
  // Generate positions for various elements - OUTSIDE the ring
  const stallPositions = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; rot: number }> = [];
    const numStalls = 12;
    const radius = 80; // Much larger radius to be outside the ring
    
    for (let i = 0; i < numStalls; i++) {
      const angle = (i / numStalls) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push({
        pos: [x, 0, z],
        rot: angle + Math.PI // Face inward
      });
    }
    
    return positions;
  }, []);
  
  const crowdPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const numCharacters = 30;
    
    for (let i = 0; i < numCharacters; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 40; // Between 60-100 units from center
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push([x, 0, z]);
    }
    
    return positions;
  }, []);
  
  const chatBubbles = [
    { pos: [65, 8, 45] as [number, number, number], text: "Buying rune armor!" },
    { pos: [-70, 8, -50] as [number, number, number], text: "Selling lobbies 200gp" },
    { pos: [55, 8, -65] as [number, number, number], text: "Wave2: Need quest help" },
    { pos: [-60, 8, 60] as [number, number, number], text: "Doubling money!" }
  ];
  
  return (
    <>
      {/* Stone tile ground */}
      <StoneTileGround />
      
      {/* Merchant stalls with NPCs */}
      {stallPositions.map((stall, i) => (
        <group key={`stall-${i}`}>
          <MerchantStall position={stall.pos} rotation={stall.rot} />
          <Merchant position={[
            stall.pos[0] - Math.sin(stall.rot) * 2,
            stall.pos[1],
            stall.pos[2] - Math.cos(stall.rot) * 2
          ]} />
        </group>
      ))}
      
      {/* Crowd characters */}
      {crowdPositions.map((pos, i) => (
        <CrowdCharacter key={`crowd-${i}`} position={pos} />
      ))}
      
      {/* Bank booths - positioned outside the ring */}
      <BankBooth position={[-90, 0, 0]} rotation={Math.PI / 2} />
      <BankBooth position={[90, 0, 0]} rotation={-Math.PI / 2} />
      <BankBooth position={[0, 0, -90]} rotation={0} />
      
      {/* Trees - scattered around the outer area */}
      <LowPolyTree position={[-70, 0, -70]} />
      <LowPolyTree position={[70, 0, -70]} />
      <LowPolyTree position={[-70, 0, 70]} />
      <LowPolyTree position={[70, 0, 70]} />
      <LowPolyTree position={[-100, 0, 0]} />
      <LowPolyTree position={[100, 0, 0]} />
      <LowPolyTree position={[0, 0, -100]} />
      <LowPolyTree position={[0, 0, 100]} />
      
      {/* Lamp posts - illuminate the outer market area */}
      <LampPost position={[-50, 0, -50]} />
      <LampPost position={[50, 0, -50]} />
      <LampPost position={[-50, 0, 50]} />
      <LampPost position={[50, 0, 50]} />
      <LampPost position={[0, 0, -75]} />
      <LampPost position={[0, 0, 75]} />
      <LampPost position={[-75, 0, 0]} />
      <LampPost position={[75, 0, 0]} />
      
      {/* Chat bubbles */}
      {chatBubbles.map((bubble, i) => (
        <ChatBubble key={`chat-${i}`} position={bubble.pos} text={bubble.text} />
      ))}
    </>
  );
}