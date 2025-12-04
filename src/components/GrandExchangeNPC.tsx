import React, { useRef } from 'react';
import { Box, useGLTF, Html, Billboard } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GrandExchangeNPCProps {
  position: [number, number, number];
  onClick: () => void;
  npcId: number;
  showClickHere?: boolean;
}

export const GrandExchangeNPC: React.FC<GrandExchangeNPCProps> = ({ position, onClick, npcId, showClickHere = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);
  const clickHereRef = useRef<THREE.Group>(null);
  
  // Load the new NPC model
  const { scene } = useGLTF('/models/_0725125504_texture.glb');
  
  // Clone the scene for this instance
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  
  // Animate the "CLICK HERE" sign
  useFrame((state) => {
    if (clickHereRef.current && showClickHere) {
      // Subtle bounce animation
      clickHereRef.current.position.y = 25 + Math.sin(state.clock.elapsedTime * 2) * 1;
      // Subtle rotation
      clickHereRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={position}>
      {/* Use the actual NPC model - scaled to match player size */}
      <primitive 
        object={clonedScene}
        scale={[5, 5, 5]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      
      {/* "CLICK HERE" sign above NPC - only show on specific NPCs */}
      {showClickHere && (
        <group ref={clickHereRef} position={[0, 25, 0]}>
          <Billboard>
            <Html
              center
              style={{
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #ffcc00, #ff9800)',
                border: '2px solid #000',
                borderRadius: '6px',
                padding: '4px 8px',
                color: '#000',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: "'RuneScape', Arial, sans-serif",
                textShadow: '1px 1px 1px rgba(255,255,255,0.3)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                animation: 'pulse 1s ease-in-out infinite'
              }}>
                CLICK HERE
                <div style={{
                  fontSize: '10px',
                  marginTop: '1px',
                  opacity: 0.8
                }}>
                  Grand Exchange
                </div>
              </div>
            </Html>
          </Billboard>
          
          {/* Arrow pointing down - smaller */}
          <mesh position={[0, -2, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[1, 2, 4]} />
            <meshBasicMaterial color="#ff9800" />
          </mesh>
        </group>
      )}
      
      {/* Name tag when hovered - removed since we have the click here sign */}
    </group>
  );
};

// Preload the NPC model
useGLTF.preload('/models/_0725125504_texture.glb');