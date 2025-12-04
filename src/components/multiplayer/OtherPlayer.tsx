import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

interface OtherPlayerProps {
  position: { x: number; y: number; z: number };
  targetPosition?: { x: number; y: number; z: number };
  direction: number;
  isMoving: boolean;
  isWaddling: boolean;
  waddlePhase: number;
  modelFile: string;
  username: string;
  onClick?: () => void;
}

export function OtherPlayer({ 
  position, 
  targetPosition,
  direction,
  isMoving,
  isWaddling,
  waddlePhase,
  modelFile = 'wAddleCYAN.glb',
  username,
  onClick
}: OtherPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(position);
  const { scene } = useGLTF(`/${modelFile}`);
  
  // Smooth movement interpolation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update position directly with fast interpolation
    const lerpSpeed = 15; // Much faster interpolation
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, position.x, delta * lerpSpeed);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, position.z, delta * lerpSpeed);
    
    // Update group position
    groupRef.current.position.x = currentPos.current.x;
    groupRef.current.position.y = -8;
    groupRef.current.position.z = currentPos.current.z + 26;
    
    // Apply rotation directly for immediate response
    groupRef.current.rotation.y = direction;
    
    // Apply waddle animation if moving
    if (isWaddling) {
      const waddleAmount = 0.105; // About 6 degrees in radians
      groupRef.current.rotation.z = Math.sin(waddlePhase) * waddleAmount;
    } else {
      // Smoothly return to neutral position when not waddling
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        0,
        delta * 5
      );
    }
  });
  
  // Setup scene
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);
  
  // Handle cursor
  const handlePointerOver = () => {
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
  };
  
  return (
    <>
      <group 
        ref={groupRef}
        onClick={onClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <group rotation={[0.2, 0, 0]}>
          <primitive object={scene.clone()} scale={[0.13, 0.13, 0.13]} />
        </group>
        
        {/* Username label - inside the group to move with penguin */}
        <Html 
          position={[0, -0.3, 0]} 
          center
          style={{
            transform: 'translateX(-23px)',
            fontSize: '16px'
          }}
        >
          <div style={{
            color: 'black',
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            {username}
          </div>
        </Html>
      </group>
    </>
  );
}

// Preload models
const PENGUIN_MODELS = [
  'wAddleBABYBL.glb', 'wAddleBLACK.glb', 'wAddleBROWN.glb', 
  'wAddleCYAN.glb', 'wAddleFORREST.glb', 'wAddleGREEN.glb',
  'wAddleLIGHTPURP.glb', 'wAddleLIME.glb', 'wAddleNAVY.glb',
  'wAddleORANGE.glb', 'wAddlePINK.glb', 'wAddlePURP.glb',
  'wAddleRED.glb', 'wAddleSALMON.glb', 'wAddleYELLOW.glb'
];

PENGUIN_MODELS.forEach(model => {
  useGLTF.preload(`/${model}`);
});