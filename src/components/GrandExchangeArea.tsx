import React, { useRef, useState } from 'react';
import { Box } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { GrandExchangeNPC } from './GrandExchangeNPC';
import { WalkingDogNPC } from './WalkingDogNPC';

interface GrandExchangeAreaProps {
  playerPosition: THREE.Vector3;
  onOpenGrandExchange: () => void;
  npcHeight?: number;
}

export const GrandExchangeArea: React.FC<GrandExchangeAreaProps> = ({ 
  playerPosition, 
  onOpenGrandExchange,
  npcHeight = 0 
}) => {
  const lastTriggerTime = useRef(0);

  // NPC positions based on the coordinates provided - height fixed at 7.5
  const npcPositions: [number, number, number][] = [
    [-3.1, 7.5, -11.3],    // First NPC
    [-7.5, 7.5, -4.7],     // Second NPC
    [8.7, 7.5, -3.3],      // Third NPC
    [10.8, 7.5, 4.8],      // Fourth NPC
    [2.1, 7.5, 10.7],      // Fifth NPC
    [-7.9, 7.5, 7.7],      // Sixth NPC
  ];

  // Check if player is in Grand Exchange area (center of map)
  React.useEffect(() => {
    const centerX = 0;
    const centerZ = 0;
    const triggerRadius = 15; // Radius around center to trigger

    const distanceToCenter = Math.sqrt(
      Math.pow(playerPosition.x - centerX, 2) + 
      Math.pow(playerPosition.z - centerZ, 2)
    );

    if (distanceToCenter < triggerRadius) {
      const now = Date.now();
      // Only trigger once every 5 seconds to avoid spam
      if (now - lastTriggerTime.current > 5000) {
        lastTriggerTime.current = now;
        console.log('[Grand Exchange] Player entered trigger zone');
        onOpenGrandExchange();
      }
    }
  }, [playerPosition, onOpenGrandExchange]);

  return (
    <>
      {/* Invisible trigger zone visualization (for debugging) */}
      <mesh position={[0, 0.1, 0]} visible={false}>
        <cylinderGeometry args={[15, 15, 0.2, 32]} />
        <meshBasicMaterial color="yellow" transparent opacity={0.3} />
      </mesh>

      {/* Grand Exchange NPCs */}
      {npcPositions.map((position, index) => (
        <GrandExchangeNPC
          key={`ge-npc-${index}`}
          position={position}
          onClick={onOpenGrandExchange}
          npcId={index + 1}
          showClickHere={index === 0} // Only show "CLICK HERE" on the first NPC
        />
      ))}

      {/* Walking Dog NPC */}
      <WalkingDogNPC />
      
      {/* Central pillar/structure placeholder */}
      <group position={[0, 0, 0]}>
        {/* Base */}
        <Box args={[8, 2, 8]} position={[0, 1, 0]}>
          <meshStandardMaterial color="#8B7355" />
        </Box>
        
        {/* Pillar */}
        <Box args={[4, 12, 4]} position={[0, 7, 0]}>
          <meshStandardMaterial color="#A0522D" />
        </Box>
        
        {/* Top decoration */}
        <Box args={[6, 2, 6]} position={[0, 14, 0]}>
          <meshStandardMaterial color="#DAA520" metalness={0.5} roughness={0.5} />
        </Box>
      </group>
    </>
  );
};