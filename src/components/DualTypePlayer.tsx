import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { BodyTypeBCharacter } from './BodyTypeBCharacter';

interface DualTypePlayerProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  bodyType: 'A' | 'B';
  isWalking?: boolean;
  targetPosition?: THREE.Vector3;
}

export const DualTypePlayer: React.FC<DualTypePlayerProps> = ({
  position,
  rotation = [0, 0, 0],
  bodyType,
  isWalking = false,
  targetPosition
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Get character customization from localStorage
  const characterData = JSON.parse(localStorage.getItem('characterData') || '{}');
  const modelPath = bodyType === 'A' 
    ? (characterData.characterModel || 'blue_blue_white.glb')
    : 'player.glb'; // Fallback for body type B
  
  const { scene } = useGLTF(`/models/${modelPath}`);
  
  // Camera follow logic
  useFrame(() => {
    if (groupRef.current) {
      const playerPosition = groupRef.current.position;
      
      // Smooth camera follow
      const cameraOffset = new THREE.Vector3(0, 10, 15);
      const desiredCameraPosition = playerPosition.clone().add(cameraOffset);
      
      camera.position.lerp(desiredCameraPosition, 0.1);
      camera.lookAt(playerPosition);
    }
  });

  // Movement logic
  useEffect(() => {
    if (targetPosition && groupRef.current) {
      const moveToTarget = () => {
        const currentPos = groupRef.current!.position;
        const direction = new THREE.Vector3()
          .subVectors(targetPosition, currentPos)
          .normalize();
        
        const distance = currentPos.distanceTo(targetPosition);
        
        if (distance > 0.1) {
          const moveSpeed = 0.1;
          currentPos.add(direction.multiplyScalar(moveSpeed));
          
          // Rotate to face movement direction
          const angle = Math.atan2(direction.x, direction.z);
          groupRef.current!.rotation.y = angle;
        }
      };
      
      const interval = setInterval(moveToTarget, 16); // 60fps
      return () => clearInterval(interval);
    }
  }, [targetPosition]);

  if (bodyType === 'B') {
    return (
      <group ref={groupRef} position={position}>
        <BodyTypeBCharacter
          position={[0, 0, 0]}
          rotation={rotation}
          scale={1}
          isWalking={isWalking}
        />
      </group>
    );
  }

  // Body Type A - Original player.glb model
  if (!scene) return null;
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive 
        object={scene} 
        scale={[0.5, 0.5, 0.5]} 
      />
    </group>
  );
};

// Preload the model
useGLTF.preload("/models/player.glb");