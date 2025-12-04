import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Arrow3DProps {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  onHit?: (position: THREE.Vector3) => void;
  onRemove: () => void;
}

function Arrow3D({ position, direction, onHit, onRemove }: Arrow3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const velocity = useRef(direction.clone().multiplyScalar(50)); // Arrow speed
  const lifetime = useRef(0);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Update lifetime
    lifetime.current += delta;
    
    // Remove arrow after 5 seconds
    if (lifetime.current > 5) {
      onRemove();
      return;
    }
    
    // Move arrow
    meshRef.current.position.add(velocity.current.clone().multiplyScalar(delta));
    
    // Apply gravity
    velocity.current.y -= 9.8 * delta;
    
    // Point arrow in direction of movement
    const lookAt = meshRef.current.position.clone().add(velocity.current);
    meshRef.current.lookAt(lookAt);
    
    // Check if arrow hit ground
    if (meshRef.current.position.y < 0) {
      if (onHit) {
        onHit(meshRef.current.position.clone());
      }
      onRemove();
    }
  });
  
  return (
    <group ref={meshRef} position={position}>
      {/* Arrow shaft */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Arrow head */}
      <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.15, 4]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Arrow fletching (feathers) */}
      <group position={[0, 0, 0.35]}>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rotation, i) => (
          <mesh key={i} rotation={[0, rotation, 0]} position={[0.03, 0, 0]}>
            <planeGeometry args={[0.06, 0.1]} />
            <meshStandardMaterial color="#FF0000" side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default Arrow3D;