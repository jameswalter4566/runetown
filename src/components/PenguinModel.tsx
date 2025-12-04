import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ChatBubble } from './ChatBubble';

interface Message {
  id: number;
  text: string;
  timestamp: number;
}

interface PenguinModelProps {
  position: [number, number, number];
  targetPosition: [number, number, number] | null;
  onReachTarget?: () => void;
  onDirectionChange?: (direction: number) => void;
  onWaddleChange?: (isWaddling: boolean, phase: number) => void;
  modelFile?: string;
  messages?: Message[];
  onClick?: () => void;
  username?: string;
}

export function PenguinModel({ 
  position, 
  targetPosition, 
  onReachTarget,
  onDirectionChange,
  onWaddleChange,
  modelFile = 'wAddleCYAN.glb',
  messages = [],
  onClick,
  username
}: PenguinModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef({ x: position[0], z: position[2] });
  const [isMoving, setIsMoving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Load the GLB model
  const { scene, animations } = useGLTF(`/${modelFile}`);
  const { actions } = useAnimations(animations, groupRef);
  
  // Handle cursor changes
  useEffect(() => {
    document.body.style.cursor = isHovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [isHovered]);
  
  // Configure all actions when they're loaded
  useEffect(() => {
    if (actions) {
      // Stop and remove sphere animations
      const sphereAnimations = ['sphere.003_0Action', 'sphere.004_0Action'];
      
      Object.entries(actions).forEach(([name, action]) => {
        if (sphereAnimations.includes(name)) {
          console.log(`Stopping and removing animation: ${name}`);
          if (action) {
            action.stop();
            action.enabled = false;
          }
        } else {
          action.clampWhenFinished = false;
          action.setLoop(THREE.LoopRepeat, Infinity);
        }
      });
    }
  }, [actions]);
  
  // Log available animations with more detail
  useEffect(() => {
    console.log('=== ANIMATION DEBUG INFO ===');
    console.log('Number of animations:', animations.length);
    animations.forEach((anim, index) => {
      console.log(`Animation ${index}:`, {
        name: anim.name,
        duration: anim.duration,
        tracks: anim.tracks.length
      });
    });
    console.log('Actions object:', actions);
    console.log('Action names:', Object.keys(actions));
    console.log('=========================');
  }, [animations, actions]);
  
  // Handle idle animation only (no walking animation)
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      return;
    }
    
    const sphereAnimations = ['sphere.003_0Action', 'sphere.004_0Action'];
    
    // Stop all animations first
    Object.entries(actions).forEach(([name, action]) => {
      if (action) {
        action.stop();
        // Disable sphere animations completely
        if (sphereAnimations.includes(name)) {
          action.enabled = false;
        }
      }
    });
    
    // We don't want any animations playing for the penguin models
    // The waddle effect is handled in the movement logic
  }, [actions]);
  
  // Movement logic with waddle effect
  useFrame((state, delta) => {
    if (!groupRef.current || !targetPosition) return;
    
    const speed = 2.0; // Balanced speed for authentic Club Penguin movement
    const dx = targetPosition[0] - currentPos.current.x;
    const dz = targetPosition[2] - currentPos.current.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.1) {
      if (isMoving) {
        setIsMoving(false);
        onReachTarget?.();
        // Reset rotation when stopped
        groupRef.current.rotation.z = 0;
        // Report stopped waddling
        onWaddleChange?.(false, 0);
      }
    } else {
      if (!isMoving) {
        setIsMoving(true);
      }
      
      const moveDistance = speed * delta;
      const moveRatio = Math.min(moveDistance / distance, 1);
      
      currentPos.current.x += dx * moveRatio;
      currentPos.current.z += dz * moveRatio;
      
      groupRef.current.position.x = currentPos.current.x;
      groupRef.current.position.z = currentPos.current.z;
      
      
      // Rotate to face direction
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = angle;
      
      // Report direction change
      onDirectionChange?.(angle);
      
      // Waddle effect - rotate left and right
      const waddleSpeed = 8; // Speed of waddle
      const waddleAmount = 0.105; // About 6 degrees in radians
      const waddlePhase = state.clock.elapsedTime * waddleSpeed;
      groupRef.current.rotation.z = Math.sin(waddlePhase) * waddleAmount;
      
      // Report waddle state
      onWaddleChange?.(true, waddlePhase);
    }
  });
  
  // Set initial position
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.x = position[0];
      groupRef.current.position.y = position[1];
      groupRef.current.position.z = position[2];
      currentPos.current = { x: position[0], z: position[2] };
    }
  }, [position]);
  
  // Setup scene and ensure animations are loaded
  useEffect(() => {
    if (scene) {
      // Just ensure the scene is properly cloned without modifying colors
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
    
    const sphereAnimations = ['sphere.003_0Action', 'sphere.004_0Action'];
    
    // Stop any animations that try to start
    if (actions && Object.keys(actions).length > 0) {
      Object.entries(actions).forEach(([name, action]) => {
        if (action) {
          action.stop();
          // Permanently disable sphere animations
          if (sphereAnimations.includes(name)) {
            action.enabled = false;
          }
        }
      });
    }
  }, [scene, actions]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} castShadow />
      
      <group 
        ref={groupRef} 
        onClick={onClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <group rotation={[0.2, 0, 0]}>
          <primitive object={scene} scale={[0.13, 0.13, 0.13]} />
        </group>
        
        {/* Chat bubble */}
        <ChatBubble messages={messages} />
        
        {/* Username label - inside the group to move with penguin */}
        {username && (
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
        )}
      </group>
    </>
  );
}

// Preload all penguin model files
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