import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

interface OtherPlayerProps {
  position: { x: number; y: number; z: number };
  direction: number;
  isMoving: boolean;
  isWaddling: boolean;
  waddlePhase: number;
  modelFile: string;
  username: string;
  lastUpdate: number;
  onClick?: () => void;
}

export function OtherPlayer({ 
  position, 
  direction,
  isMoving,
  isWaddling,
  waddlePhase,
  modelFile = 'wAddleCYAN.glb',
  username,
  lastUpdate,
  onClick
}: OtherPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(`/${modelFile}`);
  const [isStale, setIsStale] = useState(false);
  
  // Track last update time to detect disconnected players
  useEffect(() => {
    const checkStale = setInterval(() => {
      const now = Date.now();
      const timeSinceUpdate = now - lastUpdate;
      setIsStale(timeSinceUpdate > 5000); // Consider stale after 5 seconds
    }, 1000);
    
    return () => clearInterval(checkStale);
  }, [lastUpdate]);
  
  // Direct position update with minimal interpolation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const lerpFactor = 0.3; // Higher = more responsive, lower = smoother
    
    // Apply position with fast interpolation
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      position.x,
      lerpFactor
    );
    groupRef.current.position.y = -8;
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      position.z + 26,
      lerpFactor
    );
    
    // Apply rotation directly for immediate response
    groupRef.current.rotation.y = direction;
    
    // Apply waddle animation directly
    if (isWaddling) {
      const waddleAmount = 0.105;
      groupRef.current.rotation.z = Math.sin(waddlePhase) * waddleAmount;
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        0,
        0.2
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
          <primitive 
            object={scene.clone()} 
            scale={[0.13, 0.13, 0.13]} 
            // Reduce opacity if player is stale/disconnected
            {...(isStale && { 'material-opacity': 0.5 })}
          />
        </group>
        
        {/* Username label */}
        <Html 
          position={[0, -0.3, 0]} 
          center
          style={{
            transform: 'translateX(-23px)',
            fontSize: '16px',
            opacity: isStale ? 0.5 : 1
          }}
        >
          <div style={{
            color: isStale ? 'gray' : 'black',
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            {username} {isStale && '(disconnected)'}
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