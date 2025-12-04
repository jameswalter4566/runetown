import React from 'react';
import * as THREE from 'three';

interface Mountain3DProps {
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}

function Mountain3D({ position, scale = 1, rotation = 0 }: Mountain3DProps) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Base mountain cone */}
      <mesh>
        <coneGeometry args={[15, 30, 8]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      
      {/* Snow cap */}
      <mesh position={[0, 10, 0]}>
        <coneGeometry args={[8, 10, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Rocky details */}
      <mesh position={[-3, -5, 2]} rotation={[0.2, 0, 0.1]}>
        <dodecahedronGeometry args={[4, 0]} />
        <meshStandardMaterial color="#696969" />
      </mesh>
      
      <mesh position={[4, -8, -3]} rotation={[-0.1, 0.3, 0]}>
        <dodecahedronGeometry args={[3, 0]} />
        <meshStandardMaterial color="#696969" />
      </mesh>
    </group>
  );
}

export default Mountain3D;