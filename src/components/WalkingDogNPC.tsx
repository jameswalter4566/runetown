import React, { useRef, useMemo, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

interface WalkingDogNPCProps {
  scale?: number;
  yPosition?: number;
}

export const WalkingDogNPC: React.FC<WalkingDogNPCProps> = ({ 
  scale = 5, // Same scale as other NPCs
  yPosition = 7.5 // Same Y position as other NPCs
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/ziggymodel_Animation_Walking_withSkin.glb');
  
  // Clone the scene for this instance
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = SkeletonUtils.clone(scene);
    
    // Ensure all meshes are set up properly
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
      }
    });
    
    return clone;
  }, [scene]);
  
  // Set up animations with the cloned scene
  const { actions, mixer } = useAnimations(animations, clonedScene);
  
  // Movement state
  const moveSpeed = 0.05;
  const rotationSpeed = 0.02;
  const centerX = 0;
  const centerZ = 0;
  const radius = 20; // Move in a circle around the center
  const angleRef = useRef(Math.random() * Math.PI * 2); // Random starting angle
  
  // Play walking animation
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      console.log('[WalkingDogNPC] Available animations:', Object.keys(actions));
      const firstAction = Object.values(actions)[0];
      if (firstAction) {
        firstAction.reset();
        firstAction.play();
        firstAction.setLoop(THREE.LoopRepeat, Infinity);
        console.log('[WalkingDogNPC] Playing animation');
      }
    }
  }, [actions]);
  
  // Update animation and movement
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update animation
    if (mixer) {
      mixer.update(delta);
    }
    
    // Update position - move in a circle
    angleRef.current += rotationSpeed;
    const x = centerX + Math.cos(angleRef.current) * radius;
    const z = centerZ + Math.sin(angleRef.current) * radius;
    
    groupRef.current.position.set(x, yPosition, z);
    
    // Face the direction of movement
    const nextAngle = angleRef.current + rotationSpeed;
    const nextX = centerX + Math.cos(nextAngle) * radius;
    const nextZ = centerZ + Math.sin(nextAngle) * radius;
    
    const direction = new THREE.Vector3(nextX - x, 0, nextZ - z).normalize();
    const angle = Math.atan2(direction.x, direction.z);
    groupRef.current.rotation.y = angle;
  });

  if (!clonedScene) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive 
        object={clonedScene}
        scale={[scale, scale, scale]}
        dispose={null}
      />
    </group>
  );
};

// Preload the model
useGLTF.preload('/ziggymodel_Animation_Walking_withSkin.glb');