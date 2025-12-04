import React from 'react';
import * as THREE from 'three';

interface Castle3DProps {
  position: [number, number, number];
  color: string;
  scale?: number;
}

// Generic castle component for each faction
function Castle3D({ position, color, scale = 1 }: Castle3DProps) {
  return (
    <group position={position} scale={scale}>
      {/* Castle base/foundation */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[8, 2, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Main keep/tower */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[6, 8, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Tower top/roof */}
      <mesh position={[0, 9.5, 0]}>
        <coneGeometry args={[4, 3, 4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Four corner towers */}
      {[[-3, -3], [3, -3], [-3, 3], [3, 3]].map((pos, idx) => (
        <group key={idx} position={[pos[0], 0, pos[1]]}>
          {/* Tower cylinder */}
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[1.5, 1.5, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Tower cone roof */}
          <mesh position={[0, 6.5, 0]}>
            <coneGeometry args={[2, 2, 6]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
        </group>
      ))}
      
      {/* Castle walls connecting towers */}
      {/* Front wall */}
      <mesh position={[0, 2.5, 3.5]}>
        <boxGeometry args={[5, 5, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 2.5, -3.5]}>
        <boxGeometry args={[5, 5, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-3.5, 2.5, 0]}>
        <boxGeometry args={[0.5, 5, 5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Right wall */}
      <mesh position={[3.5, 2.5, 0]}>
        <boxGeometry args={[0.5, 5, 5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Castle gate */}
      <mesh position={[0, 1.5, 3.7]}>
        <boxGeometry args={[2, 3, 0.3]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      
      {/* Battlements */}
      {[-2, -1, 0, 1, 2].map(x => (
        <mesh key={`front-${x}`} position={[x, 5.5, 3.5]}>
          <boxGeometry args={[0.8, 1, 0.5]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      
      {/* Flag pole and flag */}
      <mesh position={[0, 11, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 3]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.8, 12, 0]}>
        <planeGeometry args={[1.5, 1]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default Castle3D;