import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BodyTypeBCharacterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  isWalking?: boolean;
}

export const BodyTypeBCharacter: React.FC<BodyTypeBCharacterProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  isWalking = false
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const walkOffset = useRef(0);

  // Walking animation
  useFrame((state, delta) => {
    if (isWalking && groupRef.current) {
      walkOffset.current += delta * 4;
      
      // Animate limbs
      if (leftLegRef.current && rightLegRef.current && leftArmRef.current && rightArmRef.current) {
        const swing = Math.sin(walkOffset.current) * 0.4;
        leftLegRef.current.rotation.x = swing;
        rightLegRef.current.rotation.x = -swing;
        leftArmRef.current.rotation.x = -swing * 0.7;
        rightArmRef.current.rotation.x = swing * 0.7;
      }

      // Slight body bob
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(walkOffset.current * 2)) * 0.02;
    }
  });

  // Define colors
  const skinColor = '#d4a373';
  const shirtColor = '#a4b860';
  const pantsColor = '#6b9659';
  const bootsColor = '#4a4a4a';
  const glovesColor = '#808080';
  const beardColor = '#6b5d54';
  const beltColor = '#8b5a3c';

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Head - More angular/blocky shape */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.3, 0.35, 0.28]} />
        <meshBasicMaterial color={skinColor} />
      </mesh>

      {/* Ears - smaller and flatter */}
      <mesh position={[-0.16, 1.6, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.06]} />
        <meshBasicMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.16, 1.6, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.06]} />
        <meshBasicMaterial color={skinColor} />
      </mesh>

      {/* Diamond-shaped eyes - rotated 45 degrees */}
      <mesh position={[-0.07, 1.65, 0.141]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.04, 0.04]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.07, 1.65, 0.141]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.04, 0.04]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Diamond-shaped beard/goatee - flat diamond */}
      <mesh position={[0, 1.48, 0.145]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.12, 0.12, 0.02]} />
        <meshBasicMaterial color={beardColor} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[0.2, 0.15, 0.2]} />
        <meshBasicMaterial color={skinColor} />
      </mesh>

      {/* Torso - Very broad shoulders that taper down */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.6, 0.55, 0.28]} />
        <meshBasicMaterial color={shirtColor} />
      </mesh>

      {/* Broad angular shoulder extensions */}
      <mesh position={[-0.38, 1.18, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.3]} />
        <meshBasicMaterial color={shirtColor} />
      </mesh>
      <mesh position={[0.38, 1.18, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.3]} />
        <meshBasicMaterial color={shirtColor} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.7, 0.01]}>
        <boxGeometry args={[0.45, 0.06, 0.29]} />
        <meshBasicMaterial color={beltColor} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.38, 1.08, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.12, 0.28, 0.12]} />
          <meshBasicMaterial color={skinColor} />
        </mesh>
        {/* Elbow armor/glove */}
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.13, 0.1, 0.13]} />
          <meshBasicMaterial color={glovesColor} />
        </mesh>
        {/* Lower arm with glove */}
        <mesh position={[0, -0.48, 0]}>
          <boxGeometry args={[0.11, 0.26, 0.11]} />
          <meshBasicMaterial color={glovesColor} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[0.1, 0.12, 0.08]} />
          <meshBasicMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.38, 1.08, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.12, 0.28, 0.12]} />
          <meshBasicMaterial color={skinColor} />
        </mesh>
        {/* Elbow armor/glove */}
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.13, 0.1, 0.13]} />
          <meshBasicMaterial color={glovesColor} />
        </mesh>
        {/* Lower arm with glove */}
        <mesh position={[0, -0.48, 0]}>
          <boxGeometry args={[0.11, 0.26, 0.11]} />
          <meshBasicMaterial color={glovesColor} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[0.1, 0.12, 0.08]} />
          <meshBasicMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Pelvis/Hips */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.45, 0.2, 0.25]} />
        <meshBasicMaterial color={pantsColor} />
      </mesh>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.13, 0.4, 0]}>
        {/* Thigh and shin as one piece */}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.16, 0.85, 0.16]} />
          <meshBasicMaterial color={pantsColor} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.95, 0.02]}>
          <boxGeometry args={[0.18, 0.22, 0.22]} />
          <meshBasicMaterial color={bootsColor} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.13, 0.4, 0]}>
        {/* Thigh and shin as one piece */}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.16, 0.85, 0.16]} />
          <meshBasicMaterial color={pantsColor} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.95, 0.02]}>
          <boxGeometry args={[0.18, 0.22, 0.22]} />
          <meshBasicMaterial color={bootsColor} />
        </mesh>
      </group>
    </group>
  );
};