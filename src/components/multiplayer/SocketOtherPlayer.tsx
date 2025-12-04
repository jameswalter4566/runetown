import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { PlayerChatSubscription } from '@/components/PlayerChatSubscriptionFixed';

interface SocketOtherPlayerProps {
  position: { x: number; y: number; z: number };
  direction: number;
  isMoving: boolean;
  isMovingAnim: boolean;
  animPhase: number;
  modelFile: string;
  username: string;
  userId: string;
  chatMessage?: string;
  chatMessageTime?: number;
}

export function SocketOtherPlayer({ 
  position, 
  direction,
  isMoving,
  isMovingAnim,
  animPhase,
  modelFile,
  username,
  userId,
  chatMessage,
  chatMessageTime
}: SocketOtherPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef({ x: position.x, y: position.y, z: position.z });
  const currentRot = useRef(direction);
  const lastAnimationState = useRef<boolean | null>(null);
  const { scene, animations } = useGLTF(`/models/${modelFile}`);
  
  // Deep-clone using SkeletonUtils for animated models
  const model = useMemo(() => {
    if (!scene) return null;
    return SkeletonUtils.clone(scene);
  }, [scene]);
  
  // Clone animations for this instance
  const clonedAnimations = useMemo(() => {
    if (!animations || animations.length === 0) return [];
    return animations.map(clip => clip.clone());
  }, [animations]);
  
  // Setup animations with cloned animations and groupRef
  const { mixer, actions } = useAnimations(clonedAnimations, groupRef);
  
  // Smooth interpolation for network updates
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update animation mixer
    if (mixer) {
      const clampedDelta = Math.min(delta, 0.1);
      mixer.update(clampedDelta);
    }
    
    // Smooth position interpolation
    const lerpSpeed = 10; // Fast interpolation
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, position.x, delta * lerpSpeed);
    currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, position.y, delta * lerpSpeed);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, position.z, delta * lerpSpeed);
    
    // Smooth rotation interpolation
    currentRot.current = THREE.MathUtils.lerp(currentRot.current, direction, delta * lerpSpeed);
    
    // Apply to group
    groupRef.current.position.set(
      currentPos.current.x,
      0, // Keep at ground level
      currentPos.current.z
    );
    groupRef.current.rotation.y = currentRot.current;
  });
  
  // Setup scene and ensure matrices update
  useEffect(() => {
    if (model) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
        // CRITICAL: Ensure matrices keep updating (Unity exports often set this false)
        child.matrixAutoUpdate = true;
      });
    }
  }, [model]);
  
  // Handle walking animation based on isMoving state
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    
    // Only update if animation state changed
    if (lastAnimationState.current === isMoving) return;
    
    const animationNames = Object.keys(actions);
    if (animationNames.length === 0) return;
    
    // Use the first available animation (walking animation)
    const walkAnimation = actions[animationNames[0]];
    if (!walkAnimation) return;
    
    // Play or stop animation based on movement
    if (isMoving) {
      console.log(`[SocketOtherPlayer] ${username} started walking`);
      walkAnimation.reset().fadeIn(0.05).play();
    } else {
      console.log(`[SocketOtherPlayer] ${username} stopped walking`);
      walkAnimation.fadeOut(0.1);
    }
    
    lastAnimationState.current = isMoving;
  }, [isMoving, actions, username]);
  
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
  
  
  // Show loading box if model isn't ready
  if (!model) {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[5, 10, 5]} />
          <meshStandardMaterial color="gray" wireframe />
        </mesh>
      </group>
    );
  }
  
  return (
    <group ref={groupRef}>
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
          {username}
        </div>
      </Html>
      
      {/* Real-time chat subscription for this player */}
      <PlayerChatSubscription playerId={userId} position={[0, 22, 0]} />
    </group>
  );
}