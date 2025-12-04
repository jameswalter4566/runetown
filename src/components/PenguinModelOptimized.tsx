import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ChatBubble } from './ChatBubble';

interface Message {
  id: number;
  text: string;
  timestamp: number;
}

interface PenguinModelProps {
  position: { x: number; y: number; z: number };
  direction: number;
  isMoving: boolean;
  modelFile?: string;
  messages?: Message[];
  onClick?: () => void;
  username?: string;
  marketCap?: number;
}

export function PenguinModelOptimized({ 
  position,
  direction,
  isMoving,
  modelFile = 'wAddleCYAN.glb',
  messages = [],
  onClick,
  username,
  marketCap = 4200
}: PenguinModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const waddlePhaseRef = useRef(0);
  
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
  
  // Stop unwanted animations
  useEffect(() => {
    if (actions) {
      const sphereAnimations = ['sphere.003_0Action', 'sphere.004_0Action'];
      
      Object.entries(actions).forEach(([name, action]) => {
        if (sphereAnimations.includes(name) && action) {
          action.stop();
          action.enabled = false;
        }
      });
    }
  }, [actions]);
  
  // Update position and rotation directly
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Set position directly (no interpolation - handled by PlayerController)
    groupRef.current.position.set(position.x, 0, position.z);
    
    // Set rotation directly
    groupRef.current.rotation.y = direction;
    
    // Waddle animation
    if (isMoving) {
      waddlePhaseRef.current += delta * 8; // Waddle speed
      const waddleAmount = 0.105;
      groupRef.current.rotation.z = Math.sin(waddlePhaseRef.current) * waddleAmount;
    } else {
      // Smoothly return to neutral when stopped
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
          // Removed renderOrder to simplify layering
          child.material.depthTest = true;
          child.material.depthWrite = true;
        }
      });
    }
  }, [scene]);

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
        
        {/* Username label */}
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
              <div style={{
                fontSize: '12px',
                color: '#2E7D32',
                marginTop: '-2px'
              }}>
                ${(marketCap / 1000).toFixed(1)}k MK
              </div>
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