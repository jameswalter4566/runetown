import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

interface SimpleOtherPlayerProps {
  position: { x: number; y: number; z: number };
  rotation: number;
  isMoving: boolean;
  modelFile: string;
  username: string;
}

export function SimpleOtherPlayer({ 
  position, 
  rotation,
  isMoving,
  modelFile,
  username
}: SimpleOtherPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef({ x: position.x, y: position.y, z: position.z });
  const currentRot = useRef(rotation);
  const { scene } = useGLTF(`/models/${modelFile}`);
  
  // Clone scene to avoid sharing materials between instances
  const clonedScene = React.useMemo(() => {
    return scene.clone();
  }, [scene]);
  
  // Simple smooth interpolation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Smooth position interpolation
    const lerpSpeed = 10; // Fast interpolation
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, position.x, delta * lerpSpeed);
    currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, position.y, delta * lerpSpeed);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, position.z, delta * lerpSpeed);
    
    // Smooth rotation interpolation
    currentRot.current = THREE.MathUtils.lerp(currentRot.current, rotation, delta * lerpSpeed);
    
    // Apply to group
    groupRef.current.position.set(
      currentPos.current.x,
      currentPos.current.y,
      currentPos.current.z
    );
    groupRef.current.rotation.y = currentRot.current;
  });
  
  // Setup scene
  useEffect(() => {
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [clonedScene]);
  
  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={[50, 50, 50]} position={[0, 3, 26]} />
      
      {/* Username label */}
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
          {username}
        </div>
      </Html>
    </group>
  );
}