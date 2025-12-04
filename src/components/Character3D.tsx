import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { FactionType } from '@/types/game';
import { Knight } from './characters/Knight';

interface Character3DProps {
  faction: FactionType;
  position: [number, number, number];
  isMoving?: boolean;
  direction?: number;
}

const Character3D: React.FC<Character3DProps> = ({ faction, position, isMoving = false, direction = 0 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const knightRef = useRef<Knight>();
  
  // Use Knight class for knights faction
  useEffect(() => {
    if (faction === 'knights' && groupRef.current) {
      const knight = new Knight();
      knight.group.scale.set(0.3, 0.3, 0.3);
      groupRef.current.add(knight.group);
      knightRef.current = knight;
      
      if (isMoving) {
        knight.play();
      }
      
      return () => {
        if (groupRef.current && knight.group) {
          groupRef.current.remove(knight.group);
        }
      };
    }
  }, [faction]);
  
  // Update knight animation state
  useEffect(() => {
    if (knightRef.current) {
      if (isMoving) {
        knightRef.current.play();
      } else {
        knightRef.current.pause();
      }
    }
  }, [isMoving]);
  
  // Animation
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Update knight animation
    if (knightRef.current) {
      knightRef.current.update();
    }
    
    // Walking animation for non-knight characters
    if (isMoving && bodyRef.current && faction !== 'knights') {
      const time = state.clock.getElapsedTime();
      bodyRef.current.rotation.x = Math.sin(time * 8) * 0.1;
      
      // Arm swing
      const leftArm = groupRef.current.getObjectByName('leftArm');
      const rightArm = groupRef.current.getObjectByName('rightArm');
      if (leftArm && rightArm) {
        leftArm.rotation.x = Math.sin(time * 8) * 0.3;
        rightArm.rotation.x = -Math.sin(time * 8) * 0.3;
      }
      
      // Leg movement
      const leftLeg = groupRef.current.getObjectByName('leftLeg');
      const rightLeg = groupRef.current.getObjectByName('rightLeg');
      if (leftLeg && rightLeg) {
        leftLeg.rotation.x = -Math.sin(time * 8) * 0.4;
        rightLeg.rotation.x = Math.sin(time * 8) * 0.4;
      }
    }
    
    // Face direction
    groupRef.current.rotation.y = direction;
  });

  const getFactionColor = (): string => {
    const colors: Record<FactionType, string> = {
      knights: '#C0C0C0',
      dragons: '#FF4500',
      wizards: '#4B0082',
      goblins: '#228B22',
      elves: '#20B2AA'
    };
    return colors[faction];
  };

  const getFactionAccentColor = (): string => {
    const colors: Record<FactionType, string> = {
      knights: '#FFD700',
      dragons: '#8B0000',
      wizards: '#FFD700',
      goblins: '#4B0000',
      elves: '#FFD700'
    };
    return colors[faction];
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Only render default character for non-knight factions */}
      {faction !== 'knights' && (
        <>
          {/* Head */}
          <Sphere args={[0.3, 16, 16]} position={[0, 1.7, 0]}>
            <meshStandardMaterial color={getFactionColor()} />
          </Sphere>
      
      {/* Body/Torso */}
      <Box ref={bodyRef} args={[0.6, 0.8, 0.3]} position={[0, 1, 0]}>
        <meshStandardMaterial color={getFactionColor()} />
      </Box>
      
      {/* Arms */}
      <group name="leftArm" position={[-0.4, 1, 0]}>
        <Cylinder args={[0.08, 0.08, 0.6]} position={[0, -0.3, 0]} rotation={[0, 0, Math.PI / 8]}>
          <meshStandardMaterial color={getFactionColor()} />
        </Cylinder>
      </group>
      
      <group name="rightArm" position={[0.4, 1, 0]}>
        <Cylinder args={[0.08, 0.08, 0.6]} position={[0, -0.3, 0]} rotation={[0, 0, -Math.PI / 8]}>
          <meshStandardMaterial color={getFactionColor()} />
        </Cylinder>
      </group>
      
      {/* Legs */}
      <group name="leftLeg" position={[-0.15, 0.3, 0]}>
        <Cylinder args={[0.1, 0.1, 0.6]} position={[0, -0.3, 0]}>
          <meshStandardMaterial color={getFactionColor()} />
        </Cylinder>
      </group>
      
      <group name="rightLeg" position={[0.15, 0.3, 0]}>
        <Cylinder args={[0.1, 0.1, 0.6]} position={[0, -0.3, 0]}>
          <meshStandardMaterial color={getFactionColor()} />
        </Cylinder>
      </group>
      
      {/* Faction-specific accessories */}
      {faction === 'knights' && (
        <>
          {/* Helmet */}
          <Box args={[0.35, 0.35, 0.35]} position={[0, 1.7, 0]}>
            <meshStandardMaterial color={getFactionAccentColor()} metalness={0.8} roughness={0.2} />
          </Box>
          {/* Sword */}
          <Box args={[0.05, 0.8, 0.1]} position={[0.5, 0.7, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
          </Box>
        </>
      )}
      
      {faction === 'wizards' && (
        <>
          {/* Wizard hat */}
          <Cylinder args={[0, 0.4, 0.6]} position={[0, 2.1, 0]}>
            <meshStandardMaterial color={getFactionColor()} />
          </Cylinder>
          {/* Staff */}
          <Cylinder args={[0.05, 0.05, 1.2]} position={[0.4, 0.8, 0]} rotation={[0, 0, -Math.PI / 8]}>
            <meshStandardMaterial color="#8B4513" />
          </Cylinder>
          <Sphere args={[0.1]} position={[0.5, 1.4, 0]}>
            <meshStandardMaterial color={getFactionAccentColor()} emissive={getFactionAccentColor()} emissiveIntensity={0.5} />
          </Sphere>
        </>
      )}
      
      {faction === 'dragons' && (
        <>
          {/* Wings */}
          <Box args={[1.2, 0.8, 0.05]} position={[0, 1.2, -0.2]}>
            <meshStandardMaterial color={getFactionColor()} opacity={0.8} transparent />
          </Box>
          {/* Horns */}
          <Cylinder args={[0.05, 0, 0.3]} position={[-0.15, 1.9, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <meshStandardMaterial color={getFactionAccentColor()} />
          </Cylinder>
          <Cylinder args={[0.05, 0, 0.3]} position={[0.15, 1.9, 0]} rotation={[0, 0, Math.PI / 6]}>
            <meshStandardMaterial color={getFactionAccentColor()} />
          </Cylinder>
        </>
      )}
      
      {faction === 'goblins' && (
        <>
          {/* Pointy ears */}
          <Box args={[0.1, 0.2, 0.05]} position={[-0.35, 1.7, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <meshStandardMaterial color={getFactionColor()} />
          </Box>
          <Box args={[0.1, 0.2, 0.05]} position={[0.35, 1.7, 0]} rotation={[0, 0, Math.PI / 4]}>
            <meshStandardMaterial color={getFactionColor()} />
          </Box>
          {/* Club */}
          <Cylinder args={[0.08, 0.15, 0.6]} position={[0.4, 0.8, 0]} rotation={[0, 0, -Math.PI / 8]}>
            <meshStandardMaterial color="#8B4513" />
          </Cylinder>
        </>
      )}
      
      {faction === 'elves' && (
        <>
          {/* Pointed ears */}
          <Box args={[0.08, 0.15, 0.05]} position={[-0.32, 1.7, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <meshStandardMaterial color={getFactionColor()} />
          </Box>
          <Box args={[0.08, 0.15, 0.05]} position={[0.32, 1.7, 0]} rotation={[0, 0, Math.PI / 6]}>
            <meshStandardMaterial color={getFactionColor()} />
          </Box>
          {/* Bow */}
          <Cylinder args={[0.02, 0.02, 0.8]} position={[0.4, 0.9, 0]} rotation={[0, 0, -Math.PI / 8]}>
            <meshStandardMaterial color="#8B4513" />
          </Cylinder>
        </>
      )}
        </>
      )}
    </group>
  );
};

export default Character3D;